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

container.register(storageToken, { useValue: new BrowserStorage('local') });

const { updateMatched } = container.resolve(QuoteService);
expose<Api>({
  updateMatched,
});

webExtension.handleClickAnchor();
createApp(App).mount('#root');
