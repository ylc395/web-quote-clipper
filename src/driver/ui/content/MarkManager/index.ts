import highlightRange from 'dom-highlight-range';
import Mark from 'mark.js';
import debounce from 'lodash.debounce';
import type { Quote } from 'model/entity';
import { getQuotes } from 'driver/ui/request';
import { setBadgeText } from 'driver/ui/extension/message';
import type App from '../App';
import MarkTooltip from './MarkTooltip';
import DomMonitor, { DomMonitorEvents } from './DomMonitor';
import {
  MARK_CLASS_NAME,
  MARK_QUOTE_ID_DATASET_KEY,
  MARK_QUOTE_ID_DATASET_KEY_CAMEL,
} from './constants';
import './style.scss';

let id = 0;
const generateId = () => String(++id);

export enum MarkManagerEvents {}

export default class MarkManager {
  private readonly pen = new Mark(document.body);
  private readonly matchedQuotesMap: Record<string, Quote> = {};
  private readonly markTooltipMap: Record<string, MarkTooltip> = {};
  private readonly domMonitor: DomMonitor;
  private unmatchedQuotes?: Quote[];
  private totalMarkCount = 0;

  constructor(app: App) {
    this.domMonitor = new DomMonitor(app);
    this.domMonitor.on(DomMonitorEvents.ContentAdded, this.highlightAll);
    this.domMonitor.on(DomMonitorEvents.QuoteRemoved, this.removeQuoteById);

    this.initQuotes();
  }

  private async initQuotes() {
    try {
      const quotes = await getQuotes({
        url: location.href,
        contentType: 'pure',
        orderBy: 'contentLength',
      });

      this.unmatchedQuotes = quotes;
      this.totalMarkCount = quotes.length;
    } catch (error) {
      // todo: handle error
      console.error(error);
      return;
    }

    this.highlightAll();
  }

  private handleMouseover = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains(MARK_CLASS_NAME)) {
      this.mountTooltip(target);
    }
  };

  private get activeMarkCount() {
    return Object.keys(this.matchedQuotesMap).length;
  }

  isAvailableRange(range: Range) {
    const marks = Array.from(document.querySelectorAll(`.${MARK_CLASS_NAME}`));
    return marks.every((el) => !range.intersectsNode(el));
  }

  private mountTooltip(markEl: HTMLElement) {
    const quoteId = markEl.dataset[MARK_QUOTE_ID_DATASET_KEY_CAMEL];

    if (!quoteId || !this.matchedQuotesMap[quoteId]) {
      throw new Error('no quote');
    }

    if (this.markTooltipMap[quoteId]) {
      return;
    }

    const relatedMarks = MarkManager.getMarkElsByQuoteId(quoteId);

    this.domMonitor.stop();
    this.markTooltipMap[quoteId] = new MarkTooltip({
      quote: this.matchedQuotesMap[quoteId],
      relatedEls: relatedMarks,
      targetEl: markEl,
      onBeforeUnmount: () => {
        this.domMonitor.stop();
      },
      onUnmounted: () => {
        delete this.markTooltipMap[quoteId];
        if (this.totalMarkCount > 0) {
          this.domMonitor.start();
        }
      },
      onDelete: () => {
        this.removeQuoteById(quoteId, relatedMarks);
      },
    });
    this.domMonitor.start();
  }

  private highlightAll = debounce(async () => {
    if (!this.unmatchedQuotes) {
      throw new Error('no unmatchedQuotes');
    }

    if (this.unmatchedQuotes.length === 0) {
      return;
    }

    if (this.unmatchedQuotes.length > 0) {
      this.domMonitor.stop();
    }

    const failedQuotes: Quote[] = [];
    for (const quote of this.unmatchedQuotes) {
      const isSuccessful = this.highlightQuote(quote);

      if (!isSuccessful) {
        failedQuotes.push(quote);
      }
    }

    this.updateBadgeText();
    this.unmatchedQuotes = failedQuotes;

    if (this.totalMarkCount > 0) {
      this.domMonitor.start();
      this.domMonitor.listenHighlightTooltip();
    }
  }, 500);

  private updateBadgeText() {
    setBadgeText({
      total: this.totalMarkCount,
      active: this.activeMarkCount,
    });
  }

  highlightQuote(quote: Quote, range?: Range) {
    const quoteId = generateId();
    const className = `${MARK_CLASS_NAME} ${MARK_CLASS_NAME}-${quote.color}`;
    let result = false;

    if (range) {
      this.domMonitor.stop();
      highlightRange(range, 'mark', {
        class: className,
        [MARK_QUOTE_ID_DATASET_KEY]: quoteId,
      });
      this.domMonitor.start();
      this.totalMarkCount += 1;
      result = true;
    } else {
      const { contents } = quote;

      this.pen.mark(contents.join('\n'), {
        acrossElements: true,
        diacritics: false,
        separateWordSearch: false,
        ignoreJoiners: true,
        ignorePunctuation: ['\n'],
        className,
        each: (el: HTMLElement) => {
          el.dataset[MARK_QUOTE_ID_DATASET_KEY_CAMEL] = quoteId;
          result = true;
        },
        filter: (textNode) => {
          return !textNode.parentElement?.classList.contains(MARK_CLASS_NAME);
        },
      });
    }

    if (result) {
      if (this.activeMarkCount === 0) {
        document.addEventListener('mouseover', this.handleMouseover);
      }
      this.matchedQuotesMap[quoteId] = quote;
    }

    if (range) {
      this.updateBadgeText();
    }

    return result;
  }

  private removeQuoteById = (id: string, relatedEls?: HTMLElement[]) => {
    const quote = this.matchedQuotesMap[id];

    if (!quote) {
      throw Error('no quote when delete');
    }

    delete this.matchedQuotesMap[id];

    if (this.activeMarkCount === 0) {
      document.removeEventListener('mouseover', this.handleMouseover);
    }

    this.totalMarkCount -= 1;
    relatedEls = relatedEls || MarkManager.getMarkElsByQuoteId(id);
    this.domMonitor.stop();
    relatedEls.forEach((el) => el.replaceWith(...el.childNodes));

    if (this.totalMarkCount > 0) {
      this.domMonitor.start();
    } else {
      this.domMonitor.stopListeningHighlightTooltip();
    }

    this.updateBadgeText();

    return quote;
  };

  private static getMarkElsByQuoteId(id: string) {
    return Array.from(
      document.querySelectorAll(`[${MARK_QUOTE_ID_DATASET_KEY}="${id}"]`),
    ) as HTMLElement[];
  }
}
