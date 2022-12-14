import type QuoteService from 'service/QuoteService';
import type NoteService from 'service/NoteService';
import type { imgSrcToDataUrl } from 'service/MarkdownService';

type Background = Pick<
  QuoteService,
  'createQuote' | 'deleteQuote' | 'fetchQuotes' | 'searchNotes' | 'updateQuote'
> & {
  imgSrcToDataUrl: typeof imgSrcToDataUrl;
  searchNotes: NoteService['searchNotes'];
  destroyNotesFinder: NoteService['destroy'];
};

export default Background;
