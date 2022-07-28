import { ClientMessage, ClientMessageEvents, Response } from 'driver/message';
import type { RequestClient, FetchOptions } from 'model/client';
import type { Quote } from 'model/entity';

const postMessage = async <T = void>(message: ClientMessage) => {
  const { err, res } = await chrome.runtime.sendMessage<
    ClientMessage,
    Response<T>
  >(message);

  if (err) {
    throw new Error(String(err));
  }

  return res!;
};

export const postQuote: RequestClient['postQuote'] = (quote: Quote) => {
  return postMessage<Quote>({
    event: ClientMessageEvents.CreateQuote,
    payload: quote,
  });
};

export const getQuotes: RequestClient['getQuotes'] = (
  options: FetchOptions,
) => {
  return postMessage<Quote[]>({
    event: ClientMessageEvents.RequestQuotes,
    payload: options,
  });
};

export const updateQuote: RequestClient['updateQuote'] = async (
  quote: Quote,
) => {
  return postMessage<Quote>({
    event: ClientMessageEvents.UpdateQuote,
    payload: quote,
  });
};

export const deleteQuote: RequestClient['deleteQuote'] = async (
  quote: Quote,
) => {
  return postMessage({
    event: ClientMessageEvents.DeleteQuote,
    payload: quote,
  });
};

export const toDataUrl = (url: string) => {
  return postMessage<string>({
    event: ClientMessageEvents.GetDataUrl,
    payload: url,
  });
};
