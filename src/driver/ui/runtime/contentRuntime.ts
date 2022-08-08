import type {
  SetBadgeTextMessage,
  NotifyMessage,
} from 'driver/ui/extension/message';
import { MessageEvents } from 'driver/background/message';

import {
  Message as RuntimeMessage,
  MessageEvents as RuntimeMessageEvents,
  postMessage,
} from './message';

import * as fetch from './fetch';

export default {
  ...fetch,

  setBadgeText: (payload: SetBadgeTextMessage['payload']) => {
    return chrome.runtime.sendMessage({ event: 'setBadgeText', payload });
  },

  toDataUrl: (url: string) => {
    return postMessage<string>({
      event: MessageEvents.GetDataUrl,
      payload: url,
    });
  },

  onUrlUpdated: (cb: (newUrl: string) => void) => {
    chrome.runtime.onMessage.addListener(
      ({ event, payload }: RuntimeMessage) =>
        event === RuntimeMessageEvents.UrlUpdated &&
        // todo: we need to check frameId here but there is no such an API
        // see https://github.com/w3c/webextensions/issues/12
        cb(payload.url),
    );
  },

  notify: (option: NotifyMessage['payload']) => {
    chrome.runtime.sendMessage<NotifyMessage>({
      event: 'notify',
      payload: option,
    });
  },
} as const;
