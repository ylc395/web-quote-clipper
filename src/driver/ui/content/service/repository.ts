import browser from 'webextension-polyfill';
import { wrap } from 'lib/rpc';
import type Background from 'driver/background/api';

const endPoint = browser.runtime;
const {
  createQuote,
  fetchQuotes,
  deleteQuote,
  updateQuote,
  imgSrcToDataUrl: toDataUrl,
} = wrap<Background>({ endPoint });

export default {
  createQuote,
  fetchQuotes,
  deleteQuote,
  updateQuote,
  toDataUrl,
} as const;
