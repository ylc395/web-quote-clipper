import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';
import { storageToken } from 'model/db';
import { BrowserStorage } from 'driver/browserStorage';
import App from './view/App.vue';

container.registerSingleton(storageToken, BrowserStorage);

const rootEl = document.createElement('div');
document.body.appendChild(rootEl);
createApp(App).mount(rootEl);
