import type { Quote } from 'model/entity';
export type ClientMessage =
  | CaptureQuoteMessage
  | RequestQuotesMessage
  | DeleteQuotesMessage
  | PutQuotesMessage
  | DataUrlMessage;

export type BackgroundMessage = UrlUpdatedMessage;

export interface Response<T = unknown> {
  err?: unknown;
  res?: T;
}

export enum ClientMessageEvents {
  CreateQuote = 'CREATE_QUOTE',
  RequestQuotes = 'REQUEST',
  UpdateQuote = 'UPDATE_QUOTE',
  DeleteQuote = 'DELETE_QUOTE',
  GetDataUrl = 'GET_DATA_URL',
}

export enum BackgroundMessageEvents {
  UrlUpdated = 'URL_UPDATED',
}

interface CaptureQuoteMessage {
  event: ClientMessageEvents.CreateQuote;
  payload: Quote;
}

interface RequestQuotesMessage {
  event: ClientMessageEvents.RequestQuotes;
  payload: {
    url?: string;
    contentType: 'pure' | 'html';
  };
}

interface DeleteQuotesMessage {
  event: ClientMessageEvents.DeleteQuote;
  payload: Quote;
}

interface PutQuotesMessage {
  event: ClientMessageEvents.UpdateQuote;
  payload: Quote;
}

interface DataUrlMessage {
  event: ClientMessageEvents.GetDataUrl;
  payload: string;
}

interface UrlUpdatedMessage {
  event: BackgroundMessageEvents.UrlUpdated;
  payload: { url: string; frameId: number };
}
