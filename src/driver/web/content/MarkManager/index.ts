import highlightRange from 'dom-highlight-range';
import type { Quote } from 'model/entity';
import { getQuotes } from 'driver/web/fetcher';
import { findBoundary, warnPopup } from './highlight';
import './style.scss';

const MARK_CLASSNAME = 'web-clipper-mark';

interface Maker {
  remove: () => void;
  quote: Quote;
}

export default class MarkManager {
  private markers: Maker[] = [];
  createMark(range: Range, quote: Quote) {
    this.markers.push({
      quote,
      remove: highlightRange(range, 'mark', {
        class: `${MARK_CLASSNAME} ${MARK_CLASSNAME}-${quote.color}`,
      }),
    });
  }

  isAvailableRange(range: Range) {
    const marks = Array.from(document.querySelectorAll(`.${MARK_CLASSNAME}`));
    return marks.every((el) => !range.intersectsNode(el));
  }

  active = async () => {
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
      warnPopup(`${failQuote} quotes failed to load.`);
    }
  };

  private highlightQuote(quote: Quote) {
    const { locators, contents } = quote;
    const startEl = document.querySelector(locators[0]);
    const endEl = document.querySelector(locators[1]);

    if (!startEl || !endEl) {
      return false;
    }

    const startBoundary = findBoundary(contents[0], startEl);
    const endBoundary =
      startBoundary &&
      findBoundary(contents[contents.length - 1], endEl, startBoundary);

    if (!startBoundary || !endBoundary) {
      return false;
    }

    const range = document.createRange();
    range.setStart(...startBoundary);
    range.setEnd(...endBoundary);
    this.createMark(range, quote);

    return true;
  }

  static init() {
    const markManager = new MarkManager();
    // do not need to listen for the window.onload event, they are guaranteed to run after the DOM is complete
    markManager.active();

    return markManager;
  }
}
