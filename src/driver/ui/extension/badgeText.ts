import browser from 'webextension-polyfill';

const tabMarkRecord = {
  tabId: 0,
  total: 0,
  active: 0,
};

export function initBadgeText({ tabId }: { tabId: number }) {
  browser.action.setBadgeText({
    text: '-',
    tabId,
  });

  browser.action.setBadgeBackgroundColor({
    color: 'blue',
    tabId,
  });
}

export function setBadgeText(
  payload: { active: number; total: number },
  sender?: { tab?: { id?: number }; frameId?: number },
) {
  if (!sender?.tab?.id) {
    throw new Error('no sender id');
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

  browser.action.setBadgeText({
    text: String(tabMarkRecord.total),
    tabId,
  });

  browser.action.setBadgeBackgroundColor({
    color: tabMarkRecord.active === tabMarkRecord.total ? 'blue' : 'red',
    tabId,
  });
}
