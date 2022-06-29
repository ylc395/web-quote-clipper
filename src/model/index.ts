import type { InjectionToken } from 'tsyringe';

export enum Colors {
  Yellow = 'YELLOW',
  Green = 'GREEN',
  Blue = 'BLUE',
  Pink = 'PINK',
  Purple = 'PURPLE',
}

export interface Quote {
  sourceUrl: string;
  locator: string;
  content: string[];
  comment: string;
  color?: Colors;
  note?: Note;
}

export interface Note {
  content?: string;
  id: string;
  path: string;
}

export interface NoteDatabase {
  ready: Promise<void>;
  putQuote: (quote: Required<Quote>) => Promise<void>; // update
  postQuote: (quote: Required<Quote>) => Promise<void>; // create
  getNotesByTag: (tag: string) => Promise<Required<Note>[]>;
  getNoteById: (id: string) => Promise<Note>;
}

export interface Storage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export enum CaptureEvents {
  Captured = 'quoteCaptured',
  Commented = 'commented',
  Error = 'error',
}
export const storageToken: InjectionToken<Storage> = Symbol('storageToken');
export const databaseToken: InjectionToken<NoteDatabase> =
  Symbol('databaseToken');
