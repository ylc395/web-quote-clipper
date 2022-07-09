import type { Storage } from 'model/db';

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

export class BrowserStorage implements Storage {
  set(key: string, value: string) {
    return chrome.storage.local.set({ [key]: value });
  }

  get(key: string) {
    return chrome.storage.local.get([key]).then((v) => v[key]);
  }
}

// watch reactive data and postmessage to other processes
export class Broadcaster {}
