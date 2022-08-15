import type QuoteService from 'service/QuoteService';
import type NoteService from 'service/NoteService';
import type { imgSrcToDataUrl } from 'service/MarkdownService';

type Background = Pick<
  QuoteService,
  | 'createQuote'
  | 'deleteQuote'
  | 'fetchQuotes'
  | 'searchNotes'
  | 'updateQuote'
  | 'isReady'
> &
  Pick<NoteService, 'searchNotes' | 'setNotesFinder'> & {
    imgSrcToDataUrl: typeof imgSrcToDataUrl;
  };

export default Background;
