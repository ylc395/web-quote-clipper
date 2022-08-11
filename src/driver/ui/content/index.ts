import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';
import { storageToken } from 'model/db';
import { BrowserStorage } from 'driver/browserStorage';
import { expose } from 'lib/rpc';
import App from './view/App.vue';
import MarkManager from './service/MarkManager';
import type Api from './api';

container.registerSingleton(storageToken, BrowserStorage);
const markManager = container.resolve(MarkManager);

expose<Api>(markManager);

const rootEl = document.createElement('div');
document.body.appendChild(rootEl);
createApp(App).mount(rootEl);
