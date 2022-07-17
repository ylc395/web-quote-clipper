import type { InjectionToken } from 'tsyringe';
import type { Quote } from './entity';

export interface RequestClient {
  putQuote: (quote: Quote) => Promise<void>; // update
  postQuote: (quote: Quote) => Promise<Quote>; // create
  getQuotes: (options: {
    url?: string;
    contentType: 'html' | 'pure';
  }) => Promise<Quote[]>;
  deleteQuote: (quote: Quote) => Promise<void>;
}

export const requestClientToken: InjectionToken<RequestClient> =
  Symbol('fetcherToken');
