import browser from 'webextension-polyfill';
import { wrap } from 'lib/rpc';
import type Background from 'driver/background/rpc';
import type ExtensionUI from 'driver/ui/extension/rpc';
import * as common from './common';

const endPoint = browser.runtime;
const {
  createQuote,
  fetchQuotes,
  deleteQuote,
  updateQuote,
  imgSrcToDataUrl: toDataUrl,
} = wrap<Background>({ endPoint });

const { setBadgeText, notify } = wrap<ExtensionUI>({ endPoint });

export default {
  ...common,
  createQuote,
  fetchQuotes,
  deleteQuote,
  updateQuote,
  toDataUrl,
  setBadgeText,
  notify,
} as const;
