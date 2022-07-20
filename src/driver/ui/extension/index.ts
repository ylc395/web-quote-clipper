import type { SetBadgeTextMessage } from './message';

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

const tabMarkRecord = {
  tabId: 0,
  total: 0,
  active: 0,
};

function setBadgeText(
  payload: SetBadgeTextMessage['payload'],
  sender: { tab?: { id?: number }; frameId?: number },
) {
  if (!sender.tab?.id) {
    return;
  }

  const tabId = sender.tab.id;

  if (tabMarkRecord.tabId === tabId && sender.frameId !== 0) {
    tabMarkRecord.active += payload.active;
    tabMarkRecord.total += payload.total;
  } else {
    tabMarkRecord.tabId = tabId;
    tabMarkRecord.active = payload.active;
    tabMarkRecord.total = payload.total;
  }

  chrome.action.setBadgeText({
    text: String(tabMarkRecord.total),
    tabId,
  });

  chrome.action.setBadgeBackgroundColor({
    color: tabMarkRecord.active === tabMarkRecord.total ? 'blue' : 'red',
    tabId,
  });
}
