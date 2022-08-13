import { container, singleton } from 'tsyringe';
import { AppConfig, DEFAULT_CONFIG } from 'model/config';
import { StorageEvents, storageToken, StorageChangedEvent } from 'model/db';
import EventEmitter from 'eventemitter3';

const CONFIG_KEY = 'config';

export enum ConfigEvents {
  Updated = 'Updated',
}

@singleton()
export default class ConfigService extends EventEmitter<ConfigEvents> {
  private readonly storage = container.resolve(storageToken);
  private config?: AppConfig;
  private readonly ready: Promise<void>;

  constructor() {
    super();
    this.ready = this.init();
    this.storage.on(StorageEvents.Changed, this.handleStorageChanged);
  }

  getAll = () => {
    if (!this.config) {
      throw new Error('no config');
    }

    return { ...this.config };
  };

  private handleStorageChanged = (changes: StorageChangedEvent) => {
    if (!changes[CONFIG_KEY]) {
      return;
    }

    this.config = this.parseConfigText(changes[CONFIG_KEY].newValue);
    this.emit(ConfigEvents.Updated);
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
    this.emit(ConfigEvents.Updated);
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
