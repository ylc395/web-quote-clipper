import { Message, MessageEvents, Response } from 'driver/message';
import type { RequestClient, FetchOptions } from 'model/client';
import type { Quote } from 'model/entity';

const postMessage = async <T = void>(message: Message) => {
  const { err, res } = await chrome.runtime.sendMessage<Message, Response<T>>(
    message,
  );

  if (err) {
    throw new Error(String(err));
  }

  return res!;
};

export const postQuote: RequestClient['postQuote'] = (quote: Quote) => {
  return postMessage<Quote>({
    event: MessageEvents.CreateQuote,
    payload: quote,
  });
};

export const getQuotes: RequestClient['getQuotes'] = (
  options: FetchOptions,
) => {
  return postMessage<Required<Quote>[]>({
    event: MessageEvents.RequestQuotes,
    payload: options,
  });
};

export const putQuote: RequestClient['putQuote'] = async (quote: Quote) => {};

export const deleteQuote: RequestClient['deleteQuote'] = async (
  quote: Quote,
) => {
  return postMessage({
    event: MessageEvents.DeleteQuote,
    payload: quote,
  });
};

export const toDataUrl = (url: string) => {
  return postMessage<string>({
    event: MessageEvents.GetDataUrl,
    payload: url,
  });
};
