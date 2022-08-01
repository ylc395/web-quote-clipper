export type Message = UrlUpdatedMessage;

export enum MessageEvents {
  UrlUpdated = 'URL_UPDATED',
}

interface UrlUpdatedMessage {
  event: MessageEvents.UrlUpdated;
  payload: { url: string; frameId: number };
}
