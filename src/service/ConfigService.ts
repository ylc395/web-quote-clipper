import { container, singleton } from 'tsyringe';
import { Note, Colors } from 'model/entity';
import { storageToken } from 'model/io';

const WRITE_TARGET_ID = 'WRITE_TARGET_ID';

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

  private async init() {
    const targetId = await this.storage.get(WRITE_TARGET_ID);

    this._writeTargetId = targetId || this._writeTargetId;
  }

  get writeTargetId() {
    return this._writeTargetId;
  }

  async setWriteTarget({ id, path }: Note) {
    await this.storage.set(WRITE_TARGET_ID, id);
    this._writeTargetId = id;
  }
}
