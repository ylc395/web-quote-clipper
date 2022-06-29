import { Note, Colors } from 'model/index';
import { container, singleton } from 'tsyringe';
import { databaseToken, storageToken } from 'model/index';

const WRITE_TARGET_ID = 'WRITE_TARGET_ID';
const COLOR = 'COLOR';
const TAG = 'TAG';
const DEFAULT_TAG = 'web-quote';

@singleton()
export default class ConfigService {
  private readonly storage = container.resolve(storageToken);
  private readonly db = container.resolve(databaseToken);
  private _writeTarget: Readonly<{ id: string; path: string }> = {
    id: '',
    path: '',
  };

  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private _color: Colors = Colors.Yellow;
  private _tag = DEFAULT_TAG;

  private async init() {
    const targetId = await this.storage.get(WRITE_TARGET_ID);
    const color = (await this.storage.get(COLOR)) as Colors | null;

    if (color) {
      this._color = color;
    }

    if (!targetId) {
      return;
    }

    try {
      const targetPath = (await this.db.getNoteById(targetId)).path;
      this._writeTarget = { id: targetId, path: targetPath };
    } catch {
      await this.storage.set(WRITE_TARGET_ID, '');
    }
  }

  get color() {
    return this._color;
  }

  get writeTarget() {
    return this._writeTarget;
  }

  get tag() {
    return this._tag;
  }

  async setWriteTarget({ id, path }: Note) {
    await this.storage.set(WRITE_TARGET_ID, id);
    this._writeTarget = { id, path };
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
