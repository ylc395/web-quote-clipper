import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';
import { storageToken } from 'model/db';
import { BrowserStorage } from 'driver/browserStorage';
import App from './view/App.vue';

container.registerSingleton(storageToken, BrowserStorage);
createApp(App).mount('#root');
