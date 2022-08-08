import { MessageEvents as BackgroundMessageEvents } from 'driver/background/message';
import type { Quote } from 'model/entity';
import type { QuotesQuery } from 'model/db';

import { postMessage } from './message';

export const postQuote = (quote: Quote) => {
  return postMessage<Quote>({
    event: BackgroundMessageEvents.CreateQuote,
    payload: quote,
  });
};

export const getQuotes = (options: QuotesQuery) => {
  return postMessage<Quote[]>({
    event: BackgroundMessageEvents.RequestQuotes,
    payload: options,
  });
};

export const updateQuote = async (quote: Quote) => {
  return postMessage<Quote>({
    event: BackgroundMessageEvents.UpdateQuote,
    payload: quote,
  });
};

export const deleteQuote = async (quote: Quote) => {
  return postMessage({
    event: BackgroundMessageEvents.DeleteQuote,
    payload: quote,
  });
};
