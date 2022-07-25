import type { InjectionToken } from 'tsyringe';
import type { Quote } from './entity';

export interface FetchOptions {
  url?: string;
  orderBy?: 'contentLength' | 'createdAt';
  contentType: 'html' | 'pure';
}

export interface RequestClient {
  updateQuote: (quote: Quote) => Promise<Quote>; // update
  postQuote: (quote: Quote) => Promise<Quote>; // create
  getQuotes: (options: FetchOptions) => Promise<Quote[]>;
  deleteQuote: (quote: Quote) => Promise<void>;
}

export const requestClientToken: InjectionToken<RequestClient> =
  Symbol('fetcherToken');
