import { container } from 'tsyringe';
import { databaseToken, NoteDatabase, storageToken } from 'model/index';
import type { Quote } from '../../model';

const API_TOKEN_KEY = 'JOPLIN_API_TOKEN';
const AUTH_TOKEN_KEY = 'JOPLIN_AUTH_TOKEN';
const API_URL = 'http://localhost:27583';

export default class Joplin implements NoteDatabase {
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

  fetchNoteByTags(tag: string) {}

  async putQuote(quote: Required<Quote>) {}
  async postQuote(quote: Required<Quote>) {}
  async getNoteById(id: string) {
    return {
      content: '',
      path: '',
      id: '111',
    };
  }
  async getNotesByTag(tag: string) {
    return [await this.getNoteById('ddd')];
  }
}

container.registerSingleton(databaseToken, Joplin);
