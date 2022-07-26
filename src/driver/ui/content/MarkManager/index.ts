import highlightRange from 'dom-highlight-range';
import Mark from 'mark.js';
import debounce from 'lodash.debounce';
import type { Quote } from 'model/entity';
import { getQuotes } from 'driver/ui/request';
import { setBadgeText } from 'driver/ui/extension/message';
import { deleteQuote, updateQuote } from 'driver/ui/request';
import type App from '../App';
import MarkTooltip from './MarkTooltip';
import CommentTip from './CommentTip';
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
  readonly commentMap: Record<string, CommentTip> = {};
  private readonly domMonitor: DomMonitor;
  private unmatchedQuotes?: Quote[];
  private totalMarkCount = 0;

  constructor(app: App) {
    this.domMonitor = new DomMonitor(app);
    this.domMonitor.on(DomMonitorEvents.ContentAdded, this.highlightAll); // todo: maybe we don't need to try to match among the whole page every time
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
      this.updateBadgeText();
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

    if (this.markTooltipMap[quoteId] || this.commentMap[quoteId]?.isExpanded) {
      return;
    }

    const relatedMarks = MarkManager.getMarkElsByQuoteId(quoteId);

    this.domMonitor.stop();
    this.markTooltipMap[quoteId] = new MarkTooltip(
      {
        id: quoteId,
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
        onDelete: this.deleteQuote,
        onUpdate: this.updateQuote,
      },
      this,
    );
    this.domMonitor.start();
  }

  private highlightAll = debounce(async () => {
    if (!this.unmatchedQuotes) {
      throw new Error('no unmatchedQuotes');
    }

    console.log(`💡 ${this.unmatchedQuotes.length} to highlight`);

    if (this.unmatchedQuotes.length === 0) {
      return;
    }

    this.domMonitor.stop();
    const failedQuotes: Quote[] = [];

    for (const quote of this.unmatchedQuotes) {
      const isSuccessful = await this.highlightQuote(quote);

      if (!isSuccessful) {
        failedQuotes.push(quote);
      }
    }

    console.log(
      `${failedQuotes.length > 0 ? '💔' : '🎉'} highlightAll failed: ${
        failedQuotes.length
      }`,
    );

    this.updateBadgeText();
    this.unmatchedQuotes = failedQuotes;

    if (this.totalMarkCount > 0) {
      this.domMonitor.start();
    }
  }, 500);

  private updateBadgeText() {
    setBadgeText({
      total: this.totalMarkCount,
      active: this.activeMarkCount,
    });
  }

  async highlightQuote(quote: Quote, range?: Range) {
    const quoteId = generateId();
    const className = `${MARK_CLASS_NAME} ${MARK_CLASS_NAME}-${quote.color}`;

    const result = await new Promise<boolean>((resolve) => {
      if (range) {
        window.requestAnimationFrame(() => {
          this.domMonitor.stop();
          highlightRange(range, 'mark', {
            class: className,
            [MARK_QUOTE_ID_DATASET_KEY]: quoteId,
          });
          this.domMonitor.start();
          this.totalMarkCount += 1;
          resolve(true);
        });
      } else {
        window.requestAnimationFrame(() => {
          this.pen.mark(quote.contents.join('\n'), {
            acrossElements: true,
            diacritics: false,
            separateWordSearch: false,
            ignoreJoiners: true,
            ignorePunctuation: ['\n'],
            className,
            exclude: [`.${MARK_CLASS_NAME}`],
            each: (el: HTMLElement) => {
              el.dataset[MARK_QUOTE_ID_DATASET_KEY_CAMEL] = quoteId;
            },
            filter: (textNode) => {
              return Boolean(textNode.parentElement?.offsetParent);
            },
            done: (count) => {
              resolve(count > 0);
            },
          });
        });
      }
    });

    if (result) {
      console.log('🐮 highlight success');
      if (this.activeMarkCount === 0) {
        document.addEventListener('mouseover', this.handleMouseover);
      }
      this.matchedQuotesMap[quoteId] = quote;
      this.attachComment(quoteId, quote);
    }

    if (range) {
      this.updateBadgeText();
    }

    return result;
  }

  private attachComment(quoteId: string, quote: Quote) {
    if (this.commentMap[quoteId]) {
      this.commentMap[quoteId].updateQuote(quote);
      return;
    }

    if (quote.comment) {
      this.commentMap[quoteId] = new CommentTip({
        relatedEls: MarkManager.getMarkElsByQuoteId(quoteId),
        quote,
        quoteId,
        onUpdate: (comment: string) => {
          this.updateQuote(quoteId, { comment });
        },
        onDestroy: () => {
          delete this.commentMap[quoteId];
        },
      });
    }
  }

  private removeQuoteById = (id: string) => {
    const quote = this.matchedQuotesMap[id];

    if (!quote) {
      throw Error('no quote when delete');
    }

    delete this.matchedQuotesMap[id];

    if (this.activeMarkCount === 0) {
      document.removeEventListener('mouseover', this.handleMouseover);
    }

    this.totalMarkCount -= 1;
    const relatedEls = MarkManager.getMarkElsByQuoteId(id);
    this.domMonitor.stop();

    if (this.commentMap[id]) {
      this.commentMap[id].destroy();
    }

    relatedEls.forEach((el) => el.replaceWith(...el.childNodes));

    if (this.totalMarkCount > 0) {
      this.domMonitor.start();
    }

    this.updateBadgeText();

    return quote;
  };

  private updateQuote = async (quoteId: string, quote: Partial<Quote>) => {
    const oldQuote = this.matchedQuotesMap[quoteId];
    const newQuote = { ...oldQuote, ...quote };

    await updateQuote(newQuote);

    this.matchedQuotesMap[quoteId] = newQuote;
    this.domMonitor.stop();

    if (oldQuote.color !== newQuote.color) {
      MarkManager.getMarkElsByQuoteId(quoteId).forEach((el) => {
        el.classList.remove(`${MARK_CLASS_NAME}-${oldQuote.color}`);
        el.classList.add(`${MARK_CLASS_NAME}-${newQuote.color}`);
      });
    }

    this.attachComment(quoteId, newQuote);
    this.domMonitor.start();
  };

  private deleteQuote = async (quoteId: string) => {
    await deleteQuote(this.matchedQuotesMap[quoteId]);
    this.removeQuoteById(quoteId);
  };

  private static getMarkElsByQuoteId(id: string) {
    return Array.from(
      document.querySelectorAll(
        `.${MARK_CLASS_NAME}[${MARK_QUOTE_ID_DATASET_KEY}="${id}"]`,
      ),
    ) as HTMLElement[];
  }
}
