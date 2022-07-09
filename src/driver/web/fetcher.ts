import { Message, MessageEvents } from 'driver/message';
import type { Fetcher } from 'model/client';
import type { Quote } from 'model/entity';

const postMessage = <T = void>(message: Message) => {
  return chrome.runtime.sendMessage<Message, T>(message);
};

export const postQuote: Fetcher['postQuote'] = (quote: Quote) => {
  return postMessage({ event: MessageEvents.CreateQuote, payload: quote });
};

export const getQuotes: Fetcher['getQuotes'] = (options: {
  url?: string;
  contentType: 'pure' | 'html';
}) => {
  return postMessage<Required<Quote>[]>({
    event: MessageEvents.RequestQuotes,
    payload: options,
  });
};

export const putQuote: Fetcher['putQuote'] = async (quote: Quote) => {};

export const toDataUrl = (url: string) => {
  return postMessage<string>({
    event: MessageEvents.GetDataUrl,
    payload: url,
  });
};
