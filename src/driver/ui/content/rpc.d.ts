import type MarkManager from './service/MarkManager';

export default interface ContentScript {
  handleUrlUpdated: MarkManager['handleUrlUpdated'];
  scrollToMark: MarkManager['scrollToMark'];
  deleteQuote: MarkManager['deleteQuote'];
}
