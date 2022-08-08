import type {
  Message as BackgroundMessage,
  Response,
} from 'driver/background/message';

export type Message = UrlUpdatedMessage;

export enum MessageEvents {
  UrlUpdated = 'URL_UPDATED',
}

interface UrlUpdatedMessage {
  event: MessageEvents.UrlUpdated;
  payload: { url: string; frameId: number };
}

export const postMessage = async <T = void>(message: BackgroundMessage) => {
  const { err, res } = await chrome.runtime.sendMessage<
    BackgroundMessage,
    Response<T>
  >(message);

  if (err) {
    throw new Error(String(err));
  }

  return res!;
};
