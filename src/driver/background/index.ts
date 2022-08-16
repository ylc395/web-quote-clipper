import 'reflect-metadata';
import browser from 'webextension-polyfill';
import { imgSrcToDataUrl } from 'service/MarkdownService';
import { expose, wrap } from 'lib/rpc';
import bootstrap from './bootstrap';
import type Api from './api';
import type ContentScript from 'driver/ui/content/api';

import 'driver/ui/extension';

bootstrap(({ quoteService, noteService }) => {
  expose<Api>({
    ...quoteService,
    imgSrcToDataUrl,
    searchNotes: noteService.searchNotes,
    destroyNotesFinder: noteService.destroy,
  });
});

browser.webNavigation.onHistoryStateUpdated.addListener(
  ({ tabId, url, frameId }) => {
    const { handleUrlUpdated } = wrap<ContentScript>({
      endPoint: browser.tabs,
      target: tabId,
    });
    // todo: need to handle frameId
    handleUrlUpdated(url);
  },
);
