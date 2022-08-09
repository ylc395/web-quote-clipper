import type { Quote } from 'model/entity';
import type {
  SetBadgeTextMessage,
  NotifyMessage,
} from 'driver/ui/extension/message';
import { MessageEvents as BackgroundMessageEvents } from 'driver/background/message';
import * as fetch from './common';

export type Message = UrlUpdatedMessage | ScrollMessage | DeleteQuoteMessage;

export enum MessageEvents {
  UrlUpdated = 'URL_UPDATED',
  Scroll = 'SCROLL',
  DeleteQuote = 'DELETE_QUOTE',
}

interface UrlUpdatedMessage {
  event: MessageEvents.UrlUpdated;
  payload: { url: string; frameId: number };
}

interface ScrollMessage {
  event: MessageEvents.Scroll;
  payload: Quote;
}

interface DeleteQuoteMessage {
  event: MessageEvents.DeleteQuote;
  payload: Quote;
}

export default {
  ...fetch,
  handleMessage: (cb: (message: Message) => void) =>
    chrome.runtime.onMessage.addListener(cb),
  toDataUrl: (url: string) => {
    return fetch.postMessage<string>({
      event: BackgroundMessageEvents.GetDataUrl,
      payload: url,
    });
  },
  setBadgeText: (payload: SetBadgeTextMessage['payload']) => {
    return chrome.runtime.sendMessage({ event: 'setBadgeText', payload });
  },
  notify: (option: NotifyMessage['payload']) => {
    chrome.runtime.sendMessage<NotifyMessage>({
      event: 'notify',
      payload: option,
    });
  },
} as const;
