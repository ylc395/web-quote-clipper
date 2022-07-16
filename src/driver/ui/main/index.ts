import 'reflect-metadata';
import { container } from 'tsyringe';
import { createApp } from 'vue';
import { requestClientToken } from 'model/client';
import * as fetcher from 'driver/ui/request';
import App from './App.vue';

container.registerInstance(requestClientToken, fetcher);
createApp(App).mount('#root');
