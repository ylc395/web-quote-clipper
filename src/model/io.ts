import type { InjectionToken } from 'tsyringe';
import type { Note, Quote } from './entity';

export interface NoteDatabase {
  ready: Promise<void>;
  putQuote: (quote: Required<Quote>) => Promise<void>; // update
  postQuote: (quote: Required<Quote>) => Promise<void>; // create
  getNoteById: (id: string) => Promise<Required<Note>>;
  getAllQuotes: () => Promise<Required<Quote>[]>;
}

export interface Storage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export const storageToken: InjectionToken<Storage> = Symbol('storageToken');
export const databaseToken: InjectionToken<NoteDatabase> =
  Symbol('databaseToken');
