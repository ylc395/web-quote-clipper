import type QuoteService from './service/QuoteService';

export default interface MainUI {
  updateMatched: QuoteService['updateMatched'];
}
