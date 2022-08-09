import type { Quote } from 'model/entity';
import type { QuotesQuery } from 'model/db';
import {
  Message as BackgroundMessage,
  MessageEvents as BackgroundMessageEvents,
  Response,
} from 'driver/background/message';

export const postMessage = async <T = void>(message: BackgroundMessage) => {
  const { err, res } = await chrome.runtime.sendMessage<
    BackgroundMessage,
    Response<T>
  >(message);

  if (err) {
    throw new Error(String(err));
  }

  return res!;
};

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

export const jumpToJoplin = (noteId: string) => {
  window.open(`joplin://x-callback-url/openNote?id=${noteId}`);
};
