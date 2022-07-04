import { container } from 'tsyringe';
import { databaseToken, NoteDatabase, storageToken, Quote } from 'model/index';
import ConfigService from 'service/ConfigService';

const API_TOKEN_KEY = 'JOPLIN_API_TOKEN';
const AUTH_TOKEN_KEY = 'JOPLIN_AUTH_TOKEN';
const API_URL = 'http://localhost:27583';

export default class Joplin implements NoteDatabase {
  private readonly configService = container.resolve(ConfigService);
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

    const resBody = await res.json();

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
    const quoteContent = quote.contents
      .map((content) => `> ${content}`)
      .join('\n');
    const noteContent = `${note.content}${
      note.content.trim() ? '\n***\n' : ''
    }${quoteContent}\n>\n> @@ ${quote.sourceUrl} ${quote.locators[0]} ${
      quote.locators[1]
    } ${quote.color}`;

    await this.request('PUT', `/notes/${note.id}`, { body: noteContent });

    // set tag
    const tagName = this.configService.tag;
    let tagId = await this.getTagIdByName(tagName);

    if (!tagId) {
      const { id } = await this.request<{ id: string }>('POST', `/tags`, {
        title: tagName,
      });
      tagId = id;
    }

    await this.request('POST', `/tags/${tagId}/notes`, { id: note.id });
  }

  async getNoteById(id: string) {
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
      noteInfos.map(({ id }) =>
        this.request<{ body: string; id: string }>(
          'GET',
          `/notes/${id}?fields=body,id`,
        ),
      ),
    );

    // todo: get note path
    return notes.map(({ body, id }) => ({ content: body, id, path: '' }));
  }

  async putResource(resourceUrl: string) {
    return 'dddd';
  }
}

container.registerSingleton(databaseToken, Joplin);
