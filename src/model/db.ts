import type { InjectionToken } from 'tsyringe';
import type EventEmitter from 'eventemitter3';
import type { Quote } from './entity';

export interface QuoteDatabase {
  ready: Promise<void>;
  putQuote: (quote: Required<Quote>) => Promise<void>; // update
  postQuote: (quote: Required<Quote>) => Promise<void>; // create
  getAllQuotes: (
    contentType: 'md' | 'pure' | 'html',
  ) => Promise<Required<Quote>[]>;
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
