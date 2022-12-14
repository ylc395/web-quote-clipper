import { container } from 'tsyringe';
import type { Transformer } from 'unified';
import type { Quote, Note } from 'model/entity';
import {
  storageToken,
  QuoteDatabase,
  NotesFinder,
  QuotesQuery,
  StorageEvents,
  StorageChangedEvent,
} from 'model/db';
import ConfigService from 'service/ConfigService';
import Markdown, {
  generateQuoteIdInMd,
  QUOTE_ID_PREFIX,
  CITE_ATTR,
} from 'service/MarkdownService';
import { getUrlPath } from 'service/QuoteService';
import { DatabaseConnectionError } from 'model/error';
import { delay, timeout } from 'lib/promise';

export const JOPLIN_PORT = 27583;
const API_TOKEN_KEY = 'JOPLIN_API_TOKEN';
const AUTH_TOKEN_KEY = 'JOPLIN_AUTH_TOKEN';
const API_URL = `http://localhost:${JOPLIN_PORT}`;
const JOPLIN_RESOURCE_URL_REGEX = /^:\/\w+/;

const getSearchKeyword = (quote?: Quote) =>
  quote ? `/{#${generateQuoteIdInMd(quote)}` : `/{#${QUOTE_ID_PREFIX}`;

const RETRY_INTERVAL = 2000;

interface Notebook {
  id: string;
  children: Notebook[];
  parent_id: string;
  title: string;
}

type Repo = QuoteDatabase & NotesFinder;

export default class Joplin implements Repo {
  private readonly config = container.resolve(ConfigService);
  private readonly md = new Markdown({
    transformPlugins: [() => this.replaceImageWithResource],
    renderPlugins: [() => this.replaceSrcWithAlt],
  });
  private readonly storage = container.resolve(storageToken);
  private apiToken = '';
  private authToken = '';
  private notebooksIndex?: Record<Notebook['id'], Notebook>;
  private ready: Promise<void>;
  private destroyed = false;

  constructor(private readonly useIndex = true) {
    this.ready = this.init();
    this.storage.on(StorageEvents.Changed, (change: StorageChangedEvent) => {
      if (!this.apiToken && change[API_TOKEN_KEY]) {
        this.apiToken = change[API_TOKEN_KEY].newValue as string;
      }
    });
  }

  destroy() {
    this.destroyed = true;
  }

  private async init() {
    this.apiToken = (await this.storage.get(API_TOKEN_KEY)) || '';
    this.authToken = (await this.storage.get(AUTH_TOKEN_KEY)) || '';

    try {
      await this.requestPermission();
      this.useIndex && (await this.buildNotebookIndex());
    } catch (e) {
      await delay(RETRY_INTERVAL);
      await this.init();
    }
  }

  private async request<T = unknown>(
    options: {
      method: 'PUT' | 'GET' | 'POST';
      url: string;
      body?: Record<string, unknown> | FormData;
      forced?: boolean;
    },
    fromRequest = false,
  ): Promise<T> {
    let res: Response;
    let url: string;

    try {
      if (!options.forced) {
        await timeout(this.ready, 3000, () => {
          throw new Error('timeout');
        });
      }

      url = `${API_URL}${options.url}${
        !options.url.includes('?') ? '?' : '&'
      }token=${this.apiToken}`;

      const { method, body } = options;

      res = await fetch(url, {
        method,
        body:
          body instanceof FormData ? body : body ? JSON.stringify(body) : null,
      });
    } catch (e) {
      throw new DatabaseConnectionError((e as Error).message);
    }

    let resBody: any = await res.text();
    try {
      resBody = JSON.parse(resBody);
    } catch {}

    // todo: what if invalid token?
    if (!res.ok) {
      // https://joplinapp.org/api/references/rest_api/#error-handling
      throw new DatabaseConnectionError(
        `Invalid Joplin Response: ${resBody.error || resBody}`,
      );
    }

    if (
      typeof resBody !== 'object' ||
      !('has_more' in resBody) ||
      fromRequest
    ) {
      return resBody as T;
    }

    const result = [];
    const items = resBody.items;

    result.push(...items);

    let hasMore = resBody.has_more;
    let page = 2;

    while (hasMore) {
      const { has_more, items } = await this.request<{
        has_more: boolean;
        items: unknown[];
      }>({ ...options, url: `${url}&page=${page}` }, true);

      result.push(...items);
      hasMore = has_more;
      page += 1;
    }

    return result as unknown as T;
  }

  // https://joplinapp.org/spec/clipper_auth/#request-it-programmatically
  private async requestPermission() {
    if (this.apiToken) {
      return;
    }

    if (!this.authToken) {
      await this.requestAuthToken();
    }

    while (!this.apiToken && !this.destroyed) {
      const url = `${API_URL}/auth/check?auth_token=${this.authToken}`;
      const response = await fetch(url);

      if (response.status === 500) {
        await this.requestAuthToken();
        continue;
      }

      const json = await response.json();
      const { status, token } = json;

      if (status === 'accepted') {
        this.apiToken = token;
        this.authToken = '';
        await this.storage.set(API_TOKEN_KEY, this.apiToken);
        await this.storage.set(AUTH_TOKEN_KEY, this.authToken);
      }

      if (status === 'rejected') {
        await this.requestAuthToken();
      }

      await delay(RETRY_INTERVAL);
    }
  }

  private async requestAuthToken() {
    const url = `${API_URL}/auth`;
    const response = await fetch(url, {
      method: 'POST',
    });
    const json = await response.json();
    this.authToken = json.auth_token;
    await this.storage.set(AUTH_TOKEN_KEY, this.authToken);
  }

  private updateNoteContent(id: string, content: string) {
    return this.request({
      method: 'PUT',
      url: `/notes/${id}`,
      body: { body: content },
    });
  }

  async putQuote(quote: Quote) {
    const notes = await this.searchNotes(getSearchKeyword(quote));
    const note = notes[0];

    const newContent = this.md.updateByQuote(note.content, quote);

    if (!newContent) {
      throw new Error('put quote failed');
    }

    await this.updateNoteContent(note.id, newContent);
    return quote;
  }

  async postQuote(quote: Quote) {
    const noteId = await this.config.get('targetId');

    if (!noteId) {
      throw new Error('no target note');
    }

    // set note body
    const note = await this.getNoteById(noteId);
    const blockquote = await this.md.generateBlockquote(quote);
    const noteContent = `${note.content}${
      note.content.endsWith('\n') ? '\n' : '\n\n'
    }${blockquote}`;

    await this.updateNoteContent(noteId, noteContent);

    return {
      ...quote,
      note: { id: noteId, path: note.path },
    };
  }

  async getNoteById(id: string): Promise<Required<Note>> {
    const note = await this.request<{
      body: string;
      parent_id: string;
      title: string;
    }>({
      method: 'GET',
      url: `/notes/${id}?fields=body,parent_id,title`,
    });

    return {
      content: note.body,
      path: this.getPathOfNote(note),
      id,
    };
  }

  async getAllQuotes({ contentType, url }: QuotesQuery) {
    const urlPath = url ? getUrlPath(url) : undefined;
    const notes = await this.searchNotes(
      url ? `/${CITE_ATTR}="${urlPath}` : getSearchKeyword(),
    );

    const quotes = notes.flatMap((note) => {
      const quotes = this.md.extractQuotes(note.content, contentType, urlPath);

      return quotes.map((quote) => ({
        ...quote,
        note: { id: note.id, path: note.path },
      }));
    });

    return quotes;
  }

  async searchNotes(keyword: string) {
    if (!keyword) {
      return [];
    }

    const noteInfos = await this.request<{ id: string; parent_id: string }[]>({
      method: 'GET',
      url: `/search?query=${encodeURIComponent(keyword)}`,
    });

    const notes = await Promise.all(
      noteInfos.map(({ id }) => this.getNoteById(id)),
    );

    return notes;
  }

  private async postResource(dataUrl: string) {
    const parts = dataUrl.split(',');

    if (!parts[0]?.includes('base64')) {
      throw new Error('no base64');
    }

    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1]?.split(';')[0];
    const bytes = Uint8Array.from(byteString, (s) => s.charCodeAt(0));
    const formData = new FormData();
    // https://joplinapp.org/api/references/rest_api/#post-resources
    formData.append('data', new Blob([bytes], { type: mimeString }));
    formData.append('props', '{}');
    const resource = await this.request<{ id: string }>({
      method: 'POST',
      url: '/resources',
      body: formData,
    });

    return `:/${resource.id}`;
  }

  // alt is url in quote markdown text.
  //  see `generateQuote` in capture,js
  private replaceSrcWithAlt: Transformer = (node) => {
    this.md.visit(node, 'image', (_node: { url: string; alt: string }) => {
      _node.url = _node.alt || _node.url;
    });

    return node;
  };

  private replaceImageWithResource: Transformer = async (node) => {
    const tasks: Promise<void>[] = [];
    this.md.visit(node, 'image', (_node: { url: string }) => {
      if (JOPLIN_RESOURCE_URL_REGEX.test(_node.url)) {
        return;
      }

      tasks.push(
        this.postResource(_node.url).then((resourceUrl) => {
          _node.url = resourceUrl;
          return;
        }),
      );
    });

    await Promise.all(tasks);
    return node;
  };

  private async buildNotebookIndex() {
    if (this.notebooksIndex) {
      return;
    }

    const notebooksIndex: Record<Notebook['id'], Notebook> = {};
    const notebooks = await this.request<Notebook[]>({
      url: '/folders',
      method: 'GET',
      forced: true,
    });

    const buildIndex = (notebooks: Notebook[]) => {
      for (const notebook of notebooks) {
        notebooksIndex[notebook.id] = notebook;

        if (notebook.children) {
          buildIndex(notebook.children);
        }
      }
    };

    buildIndex(notebooks);
    this.notebooksIndex = notebooksIndex;
  }

  private getPathOfNote(note: { parent_id: string; title: string }) {
    if (!this.notebooksIndex) {
      return note.title;
    }

    const notebooksIndex = this.notebooksIndex;
    let parentId = note.parent_id;
    let path = '';

    while (notebooksIndex[parentId]) {
      path = '/' + notebooksIndex[parentId].title + path;
      parentId = notebooksIndex[parentId].parent_id;
    }

    return `${path}/${note.title}`;
  }

  async deleteQuote(quote: Quote) {
    if (!quote.note) {
      throw new Error('no note in quote');
    }

    const note = await this.getNoteById(quote.note.id);
    const content = this.md.removeBlockquote(quote, note.content);

    if (!content) {
      throw new Error('delete failed');
    }

    await this.updateNoteContent(quote.note.id, content);
  }
}
