import browser from 'webextension-polyfill';
import { wrap } from 'lib/rpc';
import type ExtensionUI from 'driver/ui/extension/api';

const endPoint = browser.runtime;

const { setBadgeText, notify } = wrap<ExtensionUI>({ endPoint });

export default {
  setBadgeText,
  notify,
} as const;
