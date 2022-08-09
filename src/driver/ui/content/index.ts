import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';
import { storageToken } from 'model/db';
import { BrowserStorage } from 'driver/browserStorage';
import runtime, { MessageEvents } from 'driver/ui/runtime/contentRuntime';
import App from './view/App.vue';
import MarkManager from './service/MarkManager';

container.registerSingleton(storageToken, BrowserStorage);

const markManager = container.resolve(MarkManager);
runtime.handleMessage(({ event, payload }) => {
  switch (event) {
    case MessageEvents.UrlUpdated:
      // todo: we need to check frameId here but there is no such an API
      // see https://github.com/w3c/webextensions/issues/12
      return markManager.handleUrlUpdated(payload.url);
    case MessageEvents.Scroll:
      return markManager.scrollToMark(payload);
    case MessageEvents.DeleteQuote:
      return markManager.deleteQuote(payload);
    default:
      break;
  }
});

const rootEl = document.createElement('div');
document.body.appendChild(rootEl);
createApp(App).mount(rootEl);
