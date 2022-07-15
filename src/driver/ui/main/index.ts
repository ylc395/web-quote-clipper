import 'reflect-metadata';
import { container } from 'tsyringe';
import { createApp } from 'vue';
import { fetcherToken } from 'model/client';
import * as fetcher from 'driver/ui/fetcher';
import App from './App.vue';

container.registerInstance(fetcherToken, fetcher);
createApp(App).mount('#root');
