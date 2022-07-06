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
  locators: [string, string];
  contents: string[]; // no markdown syntax here, except img syntax
  comment: string;
  color?: Colors;
  note?: Note;
}

export interface Note {
  content?: string;
  id: string;
  path?: string;
}

export interface NoteDatabase {
  ready: Promise<void>;
  putQuote: (quote: Required<Quote>) => Promise<void>; // update
  postQuote: (quote: Required<Quote>) => Promise<void>; // create
  getNoteById: (id: string) => Promise<Note>;
  getAllQuotes: () => Promise<Required<Quote>[]>;
}

export interface Storage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export const storageToken: InjectionToken<Storage> = Symbol('storageToken');
export const databaseToken: InjectionToken<NoteDatabase> =
  Symbol('databaseToken');
