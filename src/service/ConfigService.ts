import { container, singleton } from 'tsyringe';
import type { Note } from 'model/entity';
import { StorageEvents, storageToken, StorageChangedEvent } from 'model/db';

const CONFIG_KEY = 'config';

enum DbTypes {
  Joplin = 'JOPLIN',
  Github = 'GITHUB',
  Browser = 'BROWSER',
}

interface AppConfig {
  targetId: Note['id'];
  db: DbTypes;
}

const DEFAULT_CONFIG: AppConfig = {
  targetId: '622b83982fd244dca3bc3bcecb8c29e4',
  db: DbTypes.Joplin,
};

@singleton()
export default class ConfigService {
  private readonly storage = container.resolve(storageToken);
  private config?: AppConfig;
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.init();
    this.storage.on(StorageEvents.Changed, this.handleStorageChanged);
  }

  private handleStorageChanged = (changes: StorageChangedEvent) => {
    if (!changes[CONFIG_KEY]) {
      return;
    }

    this.config = this.parseConfigText(changes[CONFIG_KEY].newValue);
  };

  private parseConfigText(v: unknown) {
    let config: Partial<AppConfig>;

    try {
      // @ts-ignore
      config = JSON.parse(v);
    } catch (error) {
      config = {};
    }

    return { ...DEFAULT_CONFIG, ...config };
  }

  private async init() {
    const configText = await this.storage.get(CONFIG_KEY);
    this.config = this.parseConfigText(configText);
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
