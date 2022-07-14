import type { InjectionToken } from 'tsyringe';
import type EventEmitter from 'eventemitter3';
import type { Quote } from './entity';

export interface QuoteDatabase {
  putQuote: (quote: Quote) => Promise<void>; // update
  postQuote: (quote: Quote) => Promise<void>; // create
  getAllQuotes: (contentType: 'pure' | 'html') => Promise<Quote[]>;
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
