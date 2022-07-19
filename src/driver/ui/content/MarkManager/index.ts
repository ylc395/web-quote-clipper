import highlightRange from 'dom-highlight-range';
import Mark from 'mark.js';
import debounce from 'lodash.debounce';
import type { Quote } from 'model/entity';
import { getQuotes } from 'driver/ui/request';
import { setBadgeText } from 'driver/ui/extension/message';
import type App from '../App';
import { TooltipEvents } from '../HighlightTooltip';
import MarkTooltip from './MarkTooltip';
import './style.scss';
import { isElement } from '../utils';

const MARK_CLASS_NAME = 'web-clipper-mark';
const MARK_QUOTE_ID_DATASET_KEY = 'data-web-clipper-quote-id';
const MARK_QUOTE_ID_DATASET_KEY_CAMEL = 'webClipperQuoteId';

let id = 0;
const generateId = () => String(++id);

export default class MarkManager {
  private readonly pen = new Mark(document.body);
  private readonly matchedQuotesMap: Record<string, Quote> = {};
  private readonly markTooltipMap: Record<string, MarkTooltip> = {};
  private unmatchedQuotes?: Quote[];
  private stopMonitor = () => {
    this.domMonitor.disconnect();
  };

  private startMonitor = () => {
    this.domMonitor.observe(document.body, { subtree: true, childList: true });
  };
  private readonly domMonitor = this.createDomMonitor();
  constructor(private readonly app: App) {
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

  private totalMarkCount = 0;

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

    this.markTooltipMap[quoteId] = new MarkTooltip({
      quote: this.matchedQuotesMap[quoteId],
      relatedEls: relatedMarks,
      targetEl: markEl,
      onUnmount: () => {
        delete this.markTooltipMap[quoteId];
      },
      onDelete: () => {
        this.removeQuoteById(quoteId, relatedMarks);
      },
    });
  }

  private highlightAll = debounce(async () => {
    if (!this.unmatchedQuotes) {
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
    }

    if (this.unmatchedQuotes.length > 0) {
      this.stopMonitor();
    }

    const failedQuotes: Quote[] = [];
    for (const quote of this.unmatchedQuotes) {
      const isSuccessful = this.highlightQuote(quote);

      if (!isSuccessful) {
        failedQuotes.push(quote);
      }
    }

    if (this.unmatchedQuotes.length > 0) {
      this.startMonitor();
    }

    this.unmatchedQuotes = failedQuotes;

    setBadgeText({
      total: this.totalMarkCount,
      active: this.activeMarkCount,
    });
  }, 500);

  private highlightRange(range: Range, className: string, quoteId: string) {
    this.stopMonitor();
    highlightRange(range, 'mark', {
      class: className,
      [MARK_QUOTE_ID_DATASET_KEY]: quoteId,
    });
    this.startMonitor();

    this.totalMarkCount += 1;
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
      this.highlightRange(range, className, quoteId);
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

    return result;
  }

  private createDomMonitor() {
    this.app.highlightTooltip.on(TooltipEvents.BeforeMount, this.stopMonitor);
    this.app.highlightTooltip.on(TooltipEvents.Mounted, this.startMonitor);
    this.app.highlightTooltip.on(
      TooltipEvents.BeforeUnmounted,
      this.stopMonitor,
    );
    this.app.highlightTooltip.on(TooltipEvents.Unmounted, this.startMonitor);

    return new MutationObserver((mutationList) => {
      if (!this.unmatchedQuotes) {
        throw new Error('no unmatchedQuotes');
      }

      const selector = `.${MARK_CLASS_NAME}`;
      const addedElements = mutationList.flatMap(({ addedNodes }) =>
        Array.from(addedNodes).filter(isElement),
      );
      const removedElements = mutationList.flatMap(({ removedNodes }) =>
        Array.from(removedNodes).filter(isElement),
      );

      for (const el of removedElements) {
        const markEls = el.matches(selector)
          ? Array.of(el)
          : (Array.from(el.querySelectorAll(selector)) as HTMLElement[]);

        for (const markEl of markEls) {
          const quoteId = markEl.dataset[MARK_QUOTE_ID_DATASET_KEY];

          if (!quoteId) {
            continue;
          }

          const quote = this.removeQuoteById(quoteId);
          this.unmatchedQuotes.push(quote);
        }
      }

      if (addedElements.length > 0) {
        this.highlightAll();
      }
    });
  }

  private removeQuoteById(id: string, relatedEls?: HTMLElement[]) {
    const quote = this.matchedQuotesMap[id];
    delete this.matchedQuotesMap[id];

    if (this.activeMarkCount > 0) {
      document.removeEventListener('mouseover', this.handleMouseover);
    }

    relatedEls = relatedEls || MarkManager.getMarkElsByQuoteId(id);
    relatedEls.forEach((el) => el.replaceWith(...el.childNodes));

    return quote;
  }

  private static getMarkElsByQuoteId(id: string) {
    return Array.from(
      document.querySelectorAll(`[${MARK_QUOTE_ID_DATASET_KEY}="${id}"]`),
    ) as HTMLElement[];
  }
}
