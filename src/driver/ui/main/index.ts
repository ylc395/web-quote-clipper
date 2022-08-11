import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';
import { storageToken } from 'model/db';
import { BrowserStorage } from 'driver/browserStorage';
import webExtension from './service/extensionService';
import App from './view/App.vue';

webExtension.handleClickAnchor();

container.registerSingleton(storageToken, BrowserStorage);
createApp(App).mount('#root');
