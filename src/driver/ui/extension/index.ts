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

chrome.webNavigation.onBeforeNavigate.addListener(initBadgeText);
chrome.webNavigation.onHistoryStateUpdated.addListener(initBadgeText);
