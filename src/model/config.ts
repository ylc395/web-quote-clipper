import type { Note } from './entity';
import { DbTypes } from './db';

export enum OperationTypes {
  Persist = 'Persist',
  ClipboardInline = 'ClipboardInline',
  ClipboardBlock = 'ClipboardBlock',
}

export interface AppConfig {
  targetId?: Note['id'];
  db: DbTypes;
  operation: OperationTypes;
}

export const DEFAULT_CONFIG: AppConfig = {
  db: DbTypes.Joplin,
  operation: OperationTypes.Persist,
};
