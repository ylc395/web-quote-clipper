import 'reflect-metadata';
import { imgSrcToDataUrl } from './helper';
import bootstrap from './bootstrap';
import { Message, MessageEvents, Response } from './message';
import { MessageEvents as ContentRuntimeMessageEvents } from 'driver/ui/runtime/contentRuntime';
import 'driver/ui/extension';

bootstrap(({ quoteService }) => {
  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendBack: (payload: Response) => void) => {
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
      event: ContentRuntimeMessageEvents.UrlUpdated,
      payload: { frameId, url },
    });
  },
);
