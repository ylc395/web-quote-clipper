import 'reflect-metadata';
import { imgSrcToDataUrl } from './helper';
import bootstrap from './bootstrap';
import {
  BackgroundMessageEvents,
  ClientMessage,
  ClientMessageEvents,
  Response,
} from 'driver/message';
import 'driver/ui/extension';

bootstrap(({ quoteService }) => {
  chrome.runtime.onMessage.addListener(
    (message: ClientMessage, sender, sendBack: (payload: Response) => void) => {
      const success = (res: unknown) => sendBack({ res });
      const fail = (err: unknown) =>
        sendBack({ err: err instanceof Error ? err.message : err });

      switch (message.event) {
        case ClientMessageEvents.CreateQuote:
          quoteService.createQuote(message.payload).then(success, fail);
          return true;
        case ClientMessageEvents.RequestQuotes:
          quoteService.fetchQuotes(message.payload).then(success, fail);
          return true;
        case ClientMessageEvents.GetDataUrl:
          imgSrcToDataUrl(message.payload).then(success, fail);
          return true;
        case ClientMessageEvents.DeleteQuote:
          quoteService.deleteQuote(message.payload).then(success, fail);
          return true;
        case ClientMessageEvents.UpdateQuote:
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
      event: BackgroundMessageEvents.UrlUpdated,
      payload: { frameId, url },
    });
  },
);
