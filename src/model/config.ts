import type { Note } from './entity';
import { DbTypes } from './db';

export interface AppConfig {
  targetId: Note['id'];
  db: DbTypes;
}

export const DEFAULT_CONFIG: AppConfig = {
  targetId: '622b83982fd244dca3bc3bcecb8c29e4',
  db: DbTypes.Joplin,
};
