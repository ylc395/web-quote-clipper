import type { Storage } from 'model/index';

export default class ChromeStorage implements Storage {
  set(key: string, value: string) {
    return chrome.storage.local.set({ [key]: value });
  }

  get(key: string) {
    return chrome.storage.local.get([key]).then((v) => v[key]);
  }
}
