import type { Quote } from 'model/index';
export type Message =
  | CaptureQuoteMessage
  | RequestQuotesMessage
  | DataUrlMessage;

export enum MessageEvents {
  Captured = 'CAPTURED',
  Request = 'REQUEST',
  GetDataUrl = 'GET_DATA_URL',
}

interface CaptureQuoteMessage {
  event: MessageEvents.Captured;
  payload: Quote;
}

interface RequestQuotesMessage {
  event: MessageEvents.Request;
  payload: string;
}

interface DataUrlMessage {
  event: MessageEvents.GetDataUrl;
  payload: string;
}
