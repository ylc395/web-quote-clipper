import 'reflect-metadata';
import browser from 'webextension-polyfill';
import { imgSrcToDataUrl } from 'service/MarkdownService';
import { expose, wrap } from 'lib/rpc';
import bootstrap from './bootstrap';
import type Rpc from './rpc';
import type ContentScript from 'driver/ui/content/rpc';

import 'driver/ui/extension';

bootstrap(
  ({
    quoteService: { createQuote, updateQuote, deleteQuote, fetchQuotes },
  }) => {
    expose<Rpc>({
      createQuote,
      updateQuote,
      deleteQuote,
      fetchQuotes,
      imgSrcToDataUrl,
    });
  },
);

chrome.webNavigation.onHistoryStateUpdated.addListener(
  ({ tabId, url, frameId }) => {
    const { handleUrlUpdated } = wrap<ContentScript>({
      endPoint: browser.tabs,
      target: tabId,
    });
    // todo: need to handle frameId
    handleUrlUpdated(url);
  },
);
