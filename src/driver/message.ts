import type { Quote } from 'model/entity';
export type Message =
  | CaptureQuoteMessage
  | RequestQuotesMessage
  | DataUrlMessage;

export enum MessageEvents {
  CreateQuote = 'CREATE_QUOTE',
  RequestQuotes = 'REQUEST',
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
    contentType: 'md' | 'pure' | 'html';
  };
}

interface DataUrlMessage {
  event: MessageEvents.GetDataUrl;
  payload: string;
}
