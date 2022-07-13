import EventEmitter from 'eventemitter3';
import { Storage, StorageEvents } from 'model/db';

export async function imgSrcToDataUrl(imgSrc: string) {
  const res = await fetch(imgSrc, { credentials: 'include' });

  if (res.ok) {
    const arraybuffer = await res.arrayBuffer();

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', (result) => {
        resolve(result.target!.result as string);
      });
      reader.addEventListener('error', reject);
      reader.readAsDataURL(new Blob([arraybuffer]));
    });
  }

  return '';
}

const STORAGE_AREA = 'local';

export class BrowserStorage
  extends EventEmitter<StorageEvents>
  implements Storage
{
  constructor() {
    super();
    chrome.storage.onChanged.addListener((changes, areaname) => {
      if (areaname === STORAGE_AREA) {
        this.emit(StorageEvents.Changed, changes);
      }
    });
  }

  set(key: string, value: string) {
    return chrome.storage[STORAGE_AREA].set({ [key]: value });
  }

  get(key: string) {
    return chrome.storage[STORAGE_AREA].get([key]).then((v) => v[key]);
  }
}

// watch reactive data and postmessage to other processes
export class Broadcaster {}
