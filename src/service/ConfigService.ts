import { container, singleton } from 'tsyringe';
import type { Note } from 'model/entity';
import { storageToken } from 'model/db';

const CONFIG_KEY = 'config';

enum DbTypes {
  Joplin = 'JOPLIN',
  Github = 'GITHUB',
}

interface AppConfig {
  targetJoplinNote?: Note['id'];
  targets?: DbTypes[];
  sources?: DbTypes[];
}

@singleton()
export default class ConfigService {
  private readonly storage = container.resolve(storageToken);
  private config?: AppConfig;
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private async init() {
    let config: AppConfig;

    try {
      config = JSON.parse(
        (await this.storage.get(CONFIG_KEY)) ||
          '{"targetJoplinNote": "622b83982fd244dca3bc3bcecb8c29e4"}',
        // '{}',
      );
    } catch (error) {
      config = {};
    }

    this.config = config;
  }

  async get<T extends keyof AppConfig>(key: T): Promise<AppConfig[T]> {
    await this.ready;

    if (!this.config) {
      throw new Error('no _config');
    }

    return this.config[key];
  }

  async set<T extends keyof AppConfig>(key: T, value: AppConfig[T]) {
    await this.ready;

    if (!this.config) {
      throw new Error('no _config');
    }

    this.config[key] = value;
    await this.storage.set(CONFIG_KEY, JSON.stringify(this.config));
  }
}
