import { createApp } from 'vue';
import App from './App.vue';

const rootEl = document.createElement('div');
document.body.appendChild(rootEl);
createApp(App).mount(rootEl);
