import { expose } from 'lib/rpc';
import type Rpc from './rpc';

import { initBadgeText, setBadgeText } from './badgeText';
import { notify } from './notify';

expose<Rpc>({
  setBadgeText,
  notify,
});

chrome.webNavigation.onCommitted.addListener(initBadgeText);
chrome.webNavigation.onHistoryStateUpdated.addListener(initBadgeText);
