import browser from 'webextension-polyfill';
import { expose } from 'lib/rpc';
import type Api from './api';

import { initBadgeText, setBadgeText } from './badgeText';
import { notify } from './notify';

expose<Api>({
  setBadgeText,
  notify,
});

browser.webNavigation.onCommitted.addListener(initBadgeText);
browser.webNavigation.onHistoryStateUpdated.addListener(initBadgeText);
