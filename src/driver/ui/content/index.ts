import { createApp } from 'vue';
import MarkManager from './service/MarkManager';
import HighlightService from './service/HighlightService';
import App from './view/App.vue';

const markManager = new MarkManager();
const highlightService = new HighlightService(markManager);

const rootEl = document.createElement('div');
document.body.appendChild(rootEl);
createApp(App, { markManager, highlightService }).mount(rootEl);
