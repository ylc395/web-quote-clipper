import { container } from 'tsyringe';
import type { Transformer } from 'unified';
import {
  databaseToken,
  storageToken,
  NoteDatabase,
  Quote,
  Note,
} from 'model/index';
import ConfigService from 'service/ConfigService';
import Markdown from 'service/MarkdownService';

const API_TOKEN_KEY = 'JOPLIN_API_TOKEN';
const AUTH_TOKEN_KEY = 'JOPLIN_AUTH_TOKEN';
const API_URL = 'http://localhost:27583';

export default class Joplin implements NoteDatabase {
  private readonly config = container.resolve(ConfigService);
  private readonly md = new Markdown({
    transformPlugins: [() => this.replaceQuoteContentImage],
  });
  private readonly storage = container.resolve(storageToken);
  private apiToken = '';
  private authToken = '';
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private async init() {
    this.apiToken = (await this.storage.get(API_TOKEN_KEY)) || '';
    this.authToken = (await this.storage.get(AUTH_TOKEN_KEY)) || '';

    try {
      await this.requestPermission();
    } catch (error) {
      // todo: handle network error
    }
  }

  private async request<T = unknown>(
    options: {
      method: 'PUT' | 'GET' | 'POST';
      url: string;
      body?: Record<string, unknown> | FormData;
    },
    fromRequest = false,
  ): Promise<T> {
    let { method, url, body } = options;

    url = `${API_URL}${url}${!url.includes('?') ? '?' : '&'}token=${
      this.apiToken
    }`;

    const res = await fetch(url, {
      method,
      body:
        body instanceof FormData ? body : body ? JSON.stringify(body) : null,
    });

    let resBody: any = await res.text();
    try {
      resBody = JSON.parse(resBody);
    } catch {}

    if (!res.ok) {
      // https://joplinapp.org/api/references/rest_api/#error-handling
      throw new Error(`fail to request Joplin: ${resBody.error || resBody}`);
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

    while (!this.apiToken) {
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

      await new Promise((r) => setTimeout(r, 500));
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

  private async getTagIdByName(tagName: string): Promise<string | undefined> {
    const searchedTags = await this.request<{ id: string }[]>({
      method: 'GET',
      url: `/search?type=tag&query=${tagName}`,
    });

    return searchedTags[0]?.id;
  }

  async putQuote(quote: Required<Quote>) {}
  async postQuote(quote: Required<Quote>) {
    // set note body
    const note = await this.getNoteById(quote.note.id);
    const quoteContent = await this.generateQuoteContent(quote);
    const noteContent = `${note.content}${
      note.content.trim() ? '\n***\n' : ''
    }${quoteContent}`;

    await this.request({
      method: 'PUT',
      url: `/notes/${note.id}`,
      body: { body: noteContent },
    });

    // set tag
    const tagName = this.config.tag;
    let tagId = await this.getTagIdByName(tagName);

    if (!tagId) {
      const { id } = await this.request<{ id: string }>({
        method: 'POST',
        url: `/tags`,
        body: {
          title: tagName,
        },
      });
      tagId = id;
    }

    await this.request({
      method: 'POST',
      url: `/tags/${tagId}/notes`,
      body: { id: note.id },
    });
  }

  async getNoteById(id: string): Promise<Required<Note>> {
    const note = await this.request<{ body: string }>({
      method: 'GET',
      url: `/notes/${id}?fields=body`,
    });

    return {
      content: note.body,
      path: '',
      id,
    };
  }

  async getNotesByTag(tagName: string) {
    const tagId = await this.getTagIdByName(tagName);

    if (!tagId) {
      return [];
    }

    const noteInfos = await this.request<{ id: string; parent_id: string }[]>({
      method: 'GET',
      url: `/tags/${tagId}/notes`,
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

  private async generateQuoteContent(quote: Required<Quote>) {
    const processedContents: string[] = [];

    for (const content of quote.contents) {
      const transformed = await this.md.transform(content);
      processedContents.push(
        `> ${transformed.trim().replaceAll('\n', '\n> ')}`,
      );
    }

    return `${processedContents.join('\n>\n')}\n>\n> @@ ${
      quote.sourceUrl
    } ${quote.locators.join(' ')} ${quote.color}}`;
  }

  private replaceQuoteContentImage: Transformer = async (node) => {
    const replacer = async (_node: typeof node) => {
      if (Markdown.isImageNode(_node)) {
        _node.url = await this.postResource(_node.url);
      }

      if (Markdown.isParent(_node)) {
        for (const child of _node.children) {
          await replacer(child);
        }
      }
    };

    await replacer(node);
    return node;
  };
}

container.registerSingleton(databaseToken, Joplin);
