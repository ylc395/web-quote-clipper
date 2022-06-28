import { CaptureEvents, Quote } from 'model/index';
export type Message = CaptureMessage;

interface CaptureMessage {
  event: CaptureEvents.Captured;
  payload: Quote;
}
