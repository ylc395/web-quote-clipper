import browser from 'webextension-polyfill';
import { wrap } from 'lib/rpc';
import type Background from 'driver/background/api';
import type ContentScript from 'driver/ui/content/api';
import { getCurrentTab } from './extensionService';

const { fetchQuotes, searchNotes, destroyNotesFinder } = wrap<Background>({
  endPoint: browser.runtime,
});

const { deleteQuote, getMatchedQuoteIds, refresh } = wrap<ContentScript>({
  endPoint: browser.tabs,
  target: async () => (await getCurrentTab()).id,
});

export default {
  fetchQuotes,
  deleteQuote,
  getMatchedQuoteIds,
  searchNotes,
  destroyNotesFinder,
  refresh,
} as const;
