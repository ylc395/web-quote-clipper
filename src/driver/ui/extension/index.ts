import browser from 'webextension-polyfill';
import { expose } from 'lib/rpc';
import type Rpc from './rpc';

import { initBadgeText, setBadgeText } from './badgeText';
import { notify } from './notify';

expose<Rpc>({
  setBadgeText,
  notify,
});

browser.webNavigation.onCommitted.addListener(initBadgeText);
browser.webNavigation.onHistoryStateUpdated.addListener(initBadgeText);
