import type { InjectionToken } from 'tsyringe';
import type { Quote } from './entity';

export interface Fetcher {
  putQuote: (quote: Quote) => Promise<void>; // update
  postQuote: (quote: Quote) => Promise<void>; // create
  getQuotes: (options: {
    url?: string;
    contentType: 'html' | 'pure';
  }) => Promise<Quote[]>;
}

export const fetcherToken: InjectionToken<Fetcher> = Symbol('fetcherToken');
