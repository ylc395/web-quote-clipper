import type QuoteService from 'service/QuoteService';
import type { imgSrcToDataUrl } from 'service/MarkdownService';

type Background = Pick<
  QuoteService,
  'createQuote' | 'deleteQuote' | 'fetchQuotes' | 'searchNotes' | 'updateQuote'
> & {
  imgSrcToDataUrl: typeof imgSrcToDataUrl;
};

export default Background;
