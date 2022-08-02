import {
  Message as BackgroundMessage,
  MessageEvents,
  Response,
} from 'driver/background/message';
import type {
  SetBadgeTextMessage,
  NotifyMessage,
} from 'driver/ui/extension/message';
import type { Quote } from 'model/entity';
import type { QuotesQuery } from 'service/QuoteService';

import {
  Message as RuntimeMessage,
  MessageEvents as RuntimeMessageEvents,
} from './message';

const postMessage = async <T = void>(message: BackgroundMessage) => {
  const { err, res } = await chrome.runtime.sendMessage<
    BackgroundMessage,
    Response<T>
  >(message);

  if (err) {
    throw new Error(String(err));
  }

  return res!;
};

export default class ExtensionRuntime {
  static readonly postQuote = (quote: Quote) => {
    return postMessage<Quote>({
      event: MessageEvents.CreateQuote,
      payload: quote,
    });
  };

  static readonly getQuotes = (options: QuotesQuery) => {
    return postMessage<Quote[]>({
      event: MessageEvents.RequestQuotes,
      payload: options,
    });
  };

  static readonly updateQuote = async (quote: Quote) => {
    return postMessage<Quote>({
      event: MessageEvents.UpdateQuote,
      payload: quote,
    });
  };

  static readonly deleteQuote = async (quote: Quote) => {
    return postMessage({
      event: MessageEvents.DeleteQuote,
      payload: quote,
    });
  };

  static readonly setBadgeText = (payload: SetBadgeTextMessage['payload']) => {
    return chrome.runtime.sendMessage({ event: 'setBadgeText', payload });
  };

  static readonly toDataUrl = (url: string) => {
    return postMessage<string>({
      event: MessageEvents.GetDataUrl,
      payload: url,
    });
  };

  static readonly onUrlUpdated = (cb: (newUrl: string) => void) => {
    chrome.runtime.onMessage.addListener(
      ({ event, payload }: RuntimeMessage) =>
        event === RuntimeMessageEvents.UrlUpdated &&
        // todo: we need to check frameId here but there is no such an API
        // see https://github.com/w3c/webextensions/issues/12
        cb(payload.url),
    );
  };

  static notify(option: NotifyMessage['payload']) {
    chrome.runtime.sendMessage<NotifyMessage>({
      event: 'notify',
      payload: option,
    });
  }
}
