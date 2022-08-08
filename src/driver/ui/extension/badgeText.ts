import type { SetBadgeTextMessage } from './message';

const tabMarkRecord = {
  tabId: 0,
  total: 0,
  active: 0,
};

export function initBadgeText({ tabId }: { tabId: number }) {
  chrome.action.setBadgeText({
    text: '-',
    tabId,
  });

  chrome.action.setBadgeBackgroundColor({
    color: 'blue',
    tabId,
  });
}

export function setBadgeText(
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
