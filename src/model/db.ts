import type { InjectionToken } from 'tsyringe';
import type { Note, Quote } from './entity';

export interface QuoteDatabase {
  ready: Promise<void>;
  putQuote: (quote: Required<Quote>) => Promise<void>; // update
  postQuote: (quote: Required<Quote>) => Promise<void>; // create
  getAllQuotes: (
    contentType: 'md' | 'pure' | 'html',
  ) => Promise<Required<Quote>[]>;
}

export interface Storage {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export const storageToken: InjectionToken<Storage> = Symbol('storageToken');
export const databaseToken: InjectionToken<QuoteDatabase> =
  Symbol('databaseToken');
