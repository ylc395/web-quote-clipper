import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';
import { storageToken } from 'model/db';
import { expose } from 'lib/rpc';
import { BrowserStorage } from 'driver/browserStorage';
import webExtension from './service/extensionService';
import QuoteService from './service/QuoteService';
import App from './view/App.vue';
import type Api from './api';

container.registerSingleton(storageToken, BrowserStorage);

const { init: refresh, updateMatched } = container.resolve(QuoteService);
expose<Api>({ refresh, updateMatched });

webExtension.handleClickAnchor();
createApp(App).mount('#root');
