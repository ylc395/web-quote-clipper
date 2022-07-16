import type { SetBadgeTextMessage } from './message';

chrome.runtime.onMessage.addListener(
  ({ event, payload }: SetBadgeTextMessage, sender) => {
    switch (event) {
      case 'setBadgeText':
        if (sender.tab?.id) {
          chrome.action.setBadgeText({
            text: String(payload.active),
            tabId: sender.tab?.id,
          });
        }
        return;
      default:
        break;
    }
  },
);
