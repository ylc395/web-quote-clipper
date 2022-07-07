import type { InjectionToken } from 'tsyringe';
import type { Quote } from './entity';

export interface Fetcher {
  putQuote: (quote: Quote) => Promise<void>; // update
  postQuote: (quote: Quote) => Promise<void>; // create
  getQuotes: (source?: string) => Promise<Required<Quote>[]>;
}

export const fetcherToken: InjectionToken<Fetcher> = Symbol('fetcherToken');
