import { Message, MessageEvents } from 'driver/message';
import type { Fetcher } from 'model/client';
import type { Quote } from 'model/entity';

const postMessage = <T = void>(message: Message) => {
  return chrome.runtime.sendMessage<Message, T>(message);
};

export const postQuote: Fetcher['postQuote'] = (quote: Quote) => {
  return postMessage({ event: MessageEvents.CreateQuote, payload: quote });
};

export const getQuotes: Fetcher['getQuotes'] = (url?: string) => {
  return postMessage<Required<Quote>[]>({
    event: MessageEvents.RequestQuotes,
    payload: url,
  });
};

export const toDataUrl = (url: string) => {
  return postMessage<string>({
    event: MessageEvents.GetDataUrl,
    payload: url,
  });
};
