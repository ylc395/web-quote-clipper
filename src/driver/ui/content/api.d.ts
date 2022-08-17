import type MarkManager from './service/MarkManager';

type ContentScript = Pick<
  MarkManager,
  | 'handleUrlUpdated'
  | 'scrollToMark'
  | 'deleteQuote'
  | 'getMatchedQuoteIds'
  | 'refresh'
>;
export default ContentScript;
