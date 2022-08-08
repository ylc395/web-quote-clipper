import * as fetch from './fetch';

export default {
  ...fetch,
  getCurrentTabUrl: async () => {
    const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
    const tab = tabs[0];

    return tab.url;
  },
} as const;
