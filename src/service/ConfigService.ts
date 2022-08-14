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

    const newConfig = this.parseConfigText(changes[CONFIG_KEY].newValue);
    const diffKeys = (Object.keys(newConfig) as (keyof AppConfig)[]).reduce(
      (diffConfig: Partial<AppConfig>, key) => {
        if (newConfig[key] !== this.config![key]) {
          (diffConfig[key] as any) = newConfig[key];
        }

        return diffConfig;
      },
      {},
    );

    if (Object.keys(diffKeys).length === 0) {
      return;
    }

    this.config = newConfig;
    this.emit(ConfigEvents.Updated, diffKeys);
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

  update = async (config: Partial<AppConfig>) => {
    await this.ready;

    if (!this.config) {
      throw new Error('no _config');
    }

    this.config = { ...this.config, ...config };
    await this.storage.set(CONFIG_KEY, JSON.stringify(this.config));
  };
}
