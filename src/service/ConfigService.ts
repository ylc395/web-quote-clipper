import { Note, Colors } from 'model/index';
import { container, singleton } from 'tsyringe';
import { storageToken } from 'model/index';

const WRITE_TARGET_ID = 'WRITE_TARGET_ID';
const COLOR = 'COLOR';
const TAG = 'TAG';
export const DEFAULT_TAG = 'web-quote';

@singleton()
export default class ConfigService {
  private readonly storage = container.resolve(storageToken);
  private _writeTargetId = '622b83982fd244dca3bc3bcecb8c29e4';
  // private _writeTargetId = '';

  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private _color: Colors = Colors.Yellow;
  private _tag = DEFAULT_TAG;

  private async init() {
    const targetId = await this.storage.get(WRITE_TARGET_ID);
    const color = (await this.storage.get(COLOR)) as Colors | null;
    const tag = (await this.storage.get(TAG)) as string | null;

    this._color = color || this._color;
    this._tag = tag || this._tag;
    this._writeTargetId = targetId || this._writeTargetId;
  }

  get color() {
    return this._color;
  }

  get writeTargetId() {
    return this._writeTargetId;
  }

  get tag() {
    return this._tag;
  }

  async setWriteTarget({ id, path }: Note) {
    await this.storage.set(WRITE_TARGET_ID, id);
    this._writeTargetId = id;
  }

  async setColor(color: Colors) {
    await this.storage.set(COLOR, color);
    this._color = color;
  }

  async setTag(tag: string) {
    await this.storage.set(TAG, tag);
    this._tag = tag;
  }
}
