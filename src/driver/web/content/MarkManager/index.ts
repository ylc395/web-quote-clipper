import highlightRange from 'dom-highlight-range';
import Mark from 'mark.js';
import type { Quote } from 'model/entity';
import { getQuotes } from 'driver/web/fetcher';
import './style.scss';

const MARK_CLASSNAME = 'web-clipper-mark';
let id = 0;
const generateId = () => String(++id);

export default class MarkManager {
  private readonly pen = new Mark(document.body);
  isAvailableRange(range: Range) {
    const marks = Array.from(document.querySelectorAll(`.${MARK_CLASSNAME}`));
    return marks.every((el) => !range.intersectsNode(el));
  }

  private active = async () => {
    let quotes: Quote[];

    try {
      quotes = await getQuotes({ url: location.href, contentType: 'pure' });
    } catch (error) {
      // todo: handle error
      alert(error);
      return;
    }

    let failQuote = 0;
    for (const quote of quotes) {
      const isSuccessful = this.highlightQuote(quote);

      if (!isSuccessful) {
        failQuote += 1;
      }
    }

    if (failQuote > 0) {
      alert(`${failQuote} quotes failed to load.`);
    }
  };

  highlightQuote(quote: Quote, range?: Range) {
    const quoteId = generateId();
    const className = `${MARK_CLASSNAME} ${MARK_CLASSNAME}-${quote.color}`;

    if (range) {
      highlightRange(range, 'mark', {
        class: className,
        'data-web-clipper-quote-id': quoteId,
      });

      return true;
    }

    let result = false;
    const { contents } = quote;

    this.pen.mark(contents.join('\n'), {
      acrossElements: true,
      diacritics: false,
      separateWordSearch: false,
      ignoreJoiners: true,
      ignorePunctuation: ['\n'],
      className,
      each: (el: HTMLElement) => {
        el.dataset.webClipperQuoteId = quoteId;
        result = true;
      },
    });

    return result;
  }

  static init() {
    const markManager = new MarkManager();
    // do not need to listen for the window.onload event, they are guaranteed to run after the DOM is complete
    markManager.active();

    return markManager;
  }
}
