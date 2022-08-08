import type { Message } from './message';
import { initBadgeText, setBadgeText } from './badgeText';

chrome.runtime.onMessage.addListener(({ event, payload }: Message, sender) => {
  switch (event) {
    case 'setBadgeText':
      return setBadgeText(payload, sender);
    case 'notify':
      return chrome.notifications.create({
        silent: true,
        title: payload.title,
        type: 'basic',
        iconUrl:
          ' data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw== ',
        message: payload.content,
      });
    default:
      break;
  }
});

chrome.webNavigation.onCommitted.addListener(initBadgeText);
chrome.webNavigation.onHistoryStateUpdated.addListener(initBadgeText);
