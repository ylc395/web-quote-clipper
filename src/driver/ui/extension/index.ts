import type { SetBadgeTextMessage } from './message';
import { initBadgeText, setBadgeText } from './badgeText';

chrome.runtime.onMessage.addListener(
  ({ event, payload }: SetBadgeTextMessage, sender) => {
    switch (event) {
      case 'setBadgeText':
        return setBadgeText(payload, sender);
      default:
        break;
    }
  },
);

chrome.tabs.onCreated.addListener(initBadgeText);
chrome.tabs.onUpdated.addListener(initBadgeText);
