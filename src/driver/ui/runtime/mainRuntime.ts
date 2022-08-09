import type { Message as ContentRuntimeMessage } from './contentRuntime';
import { getQuotes, jumpToJoplin } from './common';

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
  return tabs[0];
}

export default {
  getQuotes,
  jumpToJoplin,

  getCurrentTabUrl: async () => {
    const tab = await getCurrentTab();
    return tab.url;
  },

  postMessageToCurrentTab: async (message: ContentRuntimeMessage) => {
    const tab = await getCurrentTab();

    if (!tab.id) {
      throw new Error('no tab id');
    }

    chrome.tabs.sendMessage(tab.id, message);
  },
} as const;
