import browser from 'webextension-polyfill';
import type Background from 'driver/background/rpc';
import { wrap } from 'lib/rpc';
import type ContentScript from 'driver/ui/content/rpc';
import * as common from './common';

async function getCurrentTab() {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  return tabs[0];
}

// todo: not background, content runtime!
const { fetchQuotes } = wrap<Background>({ endPoint: browser.runtime });
const { deleteQuote, scrollToMark, getMatchedQuoteIds } = wrap<ContentScript>({
  endPoint: browser.tabs,
  target: async () => (await getCurrentTab()).id,
});

export default {
  ...common,
  fetchQuotes,
  deleteQuote,
  scrollToMark,
  getMatchedQuoteIds,
  getCurrentTabUrl: async () => {
    const tab = await getCurrentTab();
    return tab.url;
  },
  handleClickAnchor: () => {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.tagName.toLowerCase() === 'a') {
        const url = target.getAttribute('href');
        url && browser.tabs.create({ url });
      }
    });
  },
} as const;
