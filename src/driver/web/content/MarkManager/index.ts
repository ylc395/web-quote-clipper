import highlightRange from 'dom-highlight-range';
import type { Quote } from 'model/entity';
import { getQuotes } from 'driver/web/fetcher';
import { findBoundary, warnPopup } from './highlight';

const MARK_CLASSNAME = 'quote-collector-mark';
const CSS = ``;

interface Maker {
  remove: () => void;
  quote: Quote;
}

export default class MarkManager {
  private markers: Maker[] = [];
  private styleEl?: HTMLStyleElement;
  createMark(range: Range, quote: Quote) {
    if (!this.styleEl) {
      const styleEl = document.createElement('style');
      styleEl.textContent = CSS;
      document.head.appendChild(styleEl);
    }

    this.markers.push({
      quote,
      remove: highlightRange(range, 'mark', { class: MARK_CLASSNAME }),
    });
  }

  isAvailableRange(range: Range) {
    const marks = Array.from(document.querySelectorAll(`.${MARK_CLASSNAME}`));
    return marks.every((el) => !range.intersectsNode(el));
  }

  active = async () => {
    const quotes = await getQuotes({ url: location.href, contentType: 'pure' });
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

  private highlightQuote(quote: Required<Quote>) {
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
    const timer = setTimeout(() => {
      window.removeEventListener('load', markManager.active);
      markManager.active();
    }, 3000);

    window.addEventListener('load', () => {
      clearTimeout(timer);
      markManager.active();
    });

    return markManager;
  }
}
