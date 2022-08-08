import 'reflect-metadata';
import { imgSrcToDataUrl } from './helper';
import bootstrap from './bootstrap';
import {
  Message as BackgroundMessage,
  MessageEvents,
  Response,
} from 'driver/background/message';
import { MessageEvents as RuntimeMessageEvents } from 'driver/ui/runtime/message';
import 'driver/ui/extension';

bootstrap(({ quoteService }) => {
  chrome.runtime.onMessage.addListener(
    (
      message: BackgroundMessage,
      sender,
      sendBack: (payload: Response) => void,
    ) => {
      const success = (res: unknown) => sendBack({ res });
      const fail = (err: unknown) =>
        sendBack({ err: err instanceof Error ? err.message : err });

      switch (message.event) {
        case MessageEvents.CreateQuote:
          quoteService.createQuote(message.payload).then(success, fail);
          return true;
        case MessageEvents.RequestQuotes:
          quoteService.fetchQuotes(message.payload).then(success, fail);
          return true;
        case MessageEvents.GetDataUrl:
          imgSrcToDataUrl(message.payload).then(success, fail);
          return true;
        case MessageEvents.DeleteQuote:
          quoteService.deleteQuote(message.payload).then(success, fail);
          return true;
        case MessageEvents.UpdateQuote:
          quoteService.updateQuote(message.payload).then(success, fail);
          return true;
        default:
          return;
      }
    },
  );
});

chrome.webNavigation.onHistoryStateUpdated.addListener(
  ({ tabId, url, frameId }) => {
    chrome.tabs.sendMessage(tabId, {
      event: RuntimeMessageEvents.UrlUpdated,
      payload: { frameId, url },
    });
  },
);
