import browser from 'webextension-polyfill';
import { wrap } from 'lib/rpc';
import type ContentScript from 'driver/ui/content/api';
import * as common from './common';

export async function getCurrentTab() {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  return tabs[0];
}

const { scrollToMark } = wrap<ContentScript>({
  endPoint: browser.tabs,
  target: async () => (await getCurrentTab()).id,
});

export default {
  ...common,
  scrollToMark,
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
