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
    method: 'PUT' | 'GET' | 'POST',
    url: string,
    body?: Record<string, unknown>,
    fromRequest = false,
  ): Promise<T> {
    url = `${API_URL}${url}${!url.includes('?') ? '?' : '&'}token=${
      this.apiToken
    }`;

    const res = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : null,
    });

    // response may be empty string
    // for example: add a existed tag to a note
    let resBody: any = await res.text();
    resBody = JSON.parse(resBody || '{}');

    // https://joplinapp.org/api/references/rest_api/#error-handling
    if (res.status >= 400) {
      throw new Error(resBody.error);
    }

    if (!('has_more' in resBody) || fromRequest) {
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
      }>(method, `${url}&page=${page}`, body, true);

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
    const searchedTags = await this.request<{ id: string }[]>(
      'GET',
      `/search?type=tag&query=${tagName}`,
    );

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

    await this.request('PUT', `/notes/${note.id}`, { body: noteContent });

    // set tag
    const tagName = this.config.tag;
    let tagId = await this.getTagIdByName(tagName);

    if (!tagId) {
      const { id } = await this.request<{ id: string }>('POST', `/tags`, {
        title: tagName,
      });
      tagId = id;
    }

    await this.request('POST', `/tags/${tagId}/notes`, { id: note.id });
  }

  async getNoteById(id: string): Promise<Required<Note>> {
    const note = await this.request<{ body: string }>(
      'GET',
      `/notes/${id}?fields=body`,
    );

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

    const noteInfos = await this.request<{ id: string; parent_id: string }[]>(
      'GET',
      `/tags/${tagId}/notes`,
    );

    const notes = await Promise.all(
      noteInfos.map(({ id }) => this.getNoteById(id)),
    );

    return notes;
  }

  private async putResource(resourceUrl: string) {
    return 'dddd';
  }

  private async generateQuoteContent(quote: Required<Quote>) {
    const processedContents: string[] = [];

    for (const content of quote.contents) {
      const transformed = await this.md.transform(content);
      processedContents.push(`> ${transformed.trim()}`);
    }

    return `${processedContents.join('\n>\n')}\n>\n> @@ ${
      quote.sourceUrl
    } ${quote.locators.join(' ')} ${quote.color}}`;
  }

  private replaceQuoteContentImage: Transformer = async (node) => {
    const replacer = async (_node: typeof node) => {
      if (Markdown.isImageNode(_node)) {
        _node.alt = _node.url;
        _node.url = await this.putResource(_node.url);
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
