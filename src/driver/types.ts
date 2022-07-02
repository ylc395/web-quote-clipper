import type { Quote } from 'model/index';
export type Message = CaptureQuoteMessage | RequestQuotesMessage;

export enum MessageEvents {
  Captured = 'CAPTURED',
  Request = 'REQUEST',
}

interface CaptureQuoteMessage {
  event: MessageEvents.Captured;
  payload: Quote;
}

interface RequestQuotesMessage {
  event: MessageEvents.Request;
  payload: string;
}
