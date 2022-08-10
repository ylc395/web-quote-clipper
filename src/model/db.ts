import type { InjectionToken } from 'tsyringe';
import type EventEmitter from 'eventemitter3';
import type { Quote } from './entity';

export interface QuotesQuery {
  url?: string;
  orderBy?: 'contentLength' | 'createdAt';
  contentType: 'html' | 'pure' | 'md';
}

export interface QuoteDatabase {
  putQuote: (quote: Quote) => Promise<Quote>; // update
  postQuote: (quote: Quote) => Promise<Quote>; // create
  getAllQuotes: (query: QuotesQuery) => Promise<Omit<Quote, 'id'>[]>;
  deleteQuote: (quote: Quote) => Promise<void>;
}

export enum StorageEvents {
  Changed = 'Changed',
}

export interface StorageChangedEvent {
  [key: string]: { newValue?: unknown; oldValue?: unknown };
}

export interface Storage extends EventEmitter<StorageEvents> {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export const storageToken: InjectionToken<Storage> = Symbol('storageToken');
export const databaseToken: InjectionToken<QuoteDatabase> =
  Symbol('databaseToken');

export enum DbTypes {
  Joplin = 'JOPLIN',
  Browser = 'BROWSER',
}
