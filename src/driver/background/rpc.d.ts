import type QuoteService from 'service/QuoteService';
import type { imgSrcToDataUrl } from 'service/MarkdownService';

export default interface Background {
  createQuote: QuoteService['createQuote'];
  updateQuote: QuoteService['updateQuote'];
  deleteQuote: QuoteService['deleteQuote'];
  fetchQuotes: QuoteService['fetchQuotes'];
  imgSrcToDataUrl: typeof imgSrcToDataUrl;
}
