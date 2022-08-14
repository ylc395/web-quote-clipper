import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';
import debounce from 'lodash.debounce';
import { storageToken } from 'model/db';
import { expose } from 'lib/rpc';
import { BrowserStorage } from 'driver/browserStorage';
import webExtension from './service/extensionService';
import QuoteService from './service/QuoteService';
import App from './view/App.vue';
import type Api from './api';

container.registerSingleton(storageToken, BrowserStorage);

const { init, updateMatched } = container.resolve(QuoteService);
expose<Api>({
  refresh: debounce(init, 500) as () => Promise<void>,
  updateMatched,
});

webExtension.handleClickAnchor();
createApp(App).mount('#root');
