import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';
import { storageToken } from 'model/db';
import { BrowserStorage } from 'driver/browserStorage';
import runtime from 'driver/ui/runtime/mainRuntime';
import App from './view/App.vue';

runtime.handleClickAnchor();

container.registerSingleton(storageToken, BrowserStorage);
createApp(App).mount('#root');
