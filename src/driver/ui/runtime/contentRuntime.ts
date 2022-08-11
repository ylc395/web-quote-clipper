import browser from 'webextension-polyfill';
import { wrap } from 'lib/rpc';
import type ExtensionUI from 'driver/ui/extension/api';
import * as common from './common';

const endPoint = browser.runtime;

const { setBadgeText, notify } = wrap<ExtensionUI>({ endPoint });

export default {
  ...common,
  setBadgeText,
  notify,
} as const;
