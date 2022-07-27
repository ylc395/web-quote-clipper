import type { SetBadgeTextMessage } from './message';

const tabMarkRecord = {
  tabId: 0,
  total: 0,
  active: 0,
};

const urlMap: Record<number, string> = {};

export function initBadgeText(
  tab: chrome.tabs.Tab | number,
  tabInfo?: chrome.tabs.TabChangeInfo,
) {
  if (tabInfo && !tabInfo.url) {
    return;
  }

  const tabId = typeof tab === 'number' ? tab : tab.id;
  const url = tabInfo?.url || (typeof tab !== 'number' && tab.url) || '';

  if (typeof tabId === 'undefined' || !url) {
    return;
  }

  const oldUrl = urlMap[tabId];
  const urlObj = new URL(url);
  const urlPath = `${urlObj.origin}${urlObj.pathname}`;

  if (oldUrl === urlPath) {
    return;
  }

  chrome.action.setBadgeText({
    text: '-',
    tabId,
  });

  chrome.action.setBadgeBackgroundColor({
    color: 'blue',
    tabId,
  });

  urlMap[tabId] = urlPath;
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
