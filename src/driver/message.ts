import type { Quote } from 'model/entity';
export type Message =
  | CaptureQuoteMessage
  | RequestQuotesMessage
  | DeleteQuotesMessage
  | DataUrlMessage;

export interface Response<T = unknown> {
  err?: unknown;
  res?: T;
}

export enum MessageEvents {
  CreateQuote = 'CREATE_QUOTE',
  RequestQuotes = 'REQUEST',
  DeleteQuote = 'DELETE_QUOTE',
  GetDataUrl = 'GET_DATA_URL',
}

interface CaptureQuoteMessage {
  event: MessageEvents.CreateQuote;
  payload: Quote;
}

interface RequestQuotesMessage {
  event: MessageEvents.RequestQuotes;
  payload: {
    url?: string;
    contentType: 'pure' | 'html';
  };
}

interface DeleteQuotesMessage {
  event: MessageEvents.DeleteQuote;
  payload: Quote;
}

interface DataUrlMessage {
  event: MessageEvents.GetDataUrl;
  payload: string;
}
