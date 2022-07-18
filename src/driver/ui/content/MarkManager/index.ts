import highlightRange from 'dom-highlight-range';
import Mark from 'mark.js';
import type { Quote } from 'model/entity';
import { getQuotes } from 'driver/ui/request';
import { setBadgeText } from 'driver/ui/extension/message';
import type App from '../App';
import { TooltipEvents } from '../HighlightTooltip';
import MarkTooltip from './MarkTooltip';
import './style.scss';

const MARK_CLASS_NAME = 'web-clipper-mark';
const MARK_QUOTE_ID_DATASET_KEY = 'data-web-clipper-quote-id';
const MARK_QUOTE_ID_DATASET_KEY_CAMEL = 'webClipperQuoteId';

let id = 0;
const generateId = () => String(++id);

export default class MarkManager {
  private pen = new Mark(document.body);
  private readonly quoteMap: Record<string, Quote> = {};
  private readonly markTooltipMap: Record<string, MarkTooltip> = {};
  private quotesToConsumed?: Quote[];
  private domMonitor?: MutationObserver;
  constructor(private readonly app: App) {
    this.highlightAll();
    document.body.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains(MARK_CLASS_NAME)) {
        this.mountTooltip(target);
      }
    });
  }

  private activeMarkCount = 0;
  private totalMarkCount = 0;

  isAvailableRange(range: Range) {
    const marks = Array.from(document.querySelectorAll(`.${MARK_CLASS_NAME}`));
    return marks.every((el) => !range.intersectsNode(el));
  }

  private mountTooltip(markEl: HTMLElement) {
    const quoteId = markEl.dataset[MARK_QUOTE_ID_DATASET_KEY_CAMEL];

    if (!quoteId || !this.quoteMap[quoteId]) {
      throw new Error('no quote');
    }

    if (this.markTooltipMap[quoteId]) {
      return;
    }

    const relatedMarks = Array.from(
      document.querySelectorAll(`[${MARK_QUOTE_ID_DATASET_KEY}="${quoteId}"]`),
    ) as HTMLElement[];

    this.markTooltipMap[quoteId] = new MarkTooltip({
      quote: this.quoteMap[quoteId],
      relatedEls: relatedMarks,
      targetEl: markEl,
      onUnmount: () => {
        delete this.markTooltipMap[quoteId];
      },
      onDelete: () => {
        relatedMarks.forEach((el) =>
          el.replaceWith(...Array.from(el.childNodes)),
        );
      },
    });
  }

  private highlightAll = async () => {
    if (!this.quotesToConsumed) {
      try {
        this.quotesToConsumed = await getQuotes({
          url: location.href,
          contentType: 'pure',
        });

        this.totalMarkCount = this.quotesToConsumed.length;
      } catch (error) {
        // todo: handle error
        alert(error);
        return;
      }
    }

    const failedQuotes: Quote[] = [];

    for (const quote of this.quotesToConsumed) {
      const isSuccessful = this.highlightQuote(quote);

      if (!isSuccessful) {
        failedQuotes.push(quote);
      }
    }

    if (failedQuotes.length > 0) {
      if (document.readyState !== 'complete') {
        window.addEventListener('load', this.highlightAll);
      } else {
        this.initDomMonitor();
      }
    }

    if (failedQuotes.length === 0 && this.domMonitor) {
      this.destroyMonitor();
    }

    this.quotesToConsumed = failedQuotes;
    setBadgeText({
      total: this.totalMarkCount,
      active: this.activeMarkCount,
    });
  };

  private highlightRange(range: Range, className: string, quoteId: string) {
    highlightRange(range, 'mark', {
      class: className,
      [MARK_QUOTE_ID_DATASET_KEY]: quoteId,
    });
    this.activeMarkCount += 1;
    this.totalMarkCount += 1;
    setBadgeText({
      total: this.totalMarkCount,
      active: this.activeMarkCount,
    });
  }

  highlightQuote(quote: Quote, range?: Range) {
    const quoteId = generateId();
    const className = `${MARK_CLASS_NAME} ${MARK_CLASS_NAME}-${quote.color}`;

    this.stopMonitor();

    if (range) {
      this.highlightRange(range, className, quoteId);
      this.quoteMap[quoteId] = quote;
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
        el.dataset[MARK_QUOTE_ID_DATASET_KEY_CAMEL] = quoteId;
        result = true;
      },
      filter: (textNode) => {
        return !textNode.parentElement?.classList.contains(MARK_CLASS_NAME);
      },
    });

    if (result) {
      this.quoteMap[quoteId] = quote;
      this.activeMarkCount += 1;
    }

    this.startMonitor();
    return result;
  }

  private initDomMonitor() {
    if (this.domMonitor) {
      return;
    }

    this.domMonitor = new MutationObserver(async (mutationList) => {
      if (!this.quotesToConsumed) {
        throw new Error('no quotes to consume');
      }

      for (let { addedNodes } of mutationList) {
        // we assumed that a quote won't cross existing node and added node
        if (addedNodes.length === 0) {
          continue;
        }

        this.pen = new Mark(addedNodes);
        await this.highlightAll();
      }
    });

    this.app.highlightTooltip.on(TooltipEvents.BeforeMount, this.stopMonitor);
    this.app.highlightTooltip.on(
      TooltipEvents.BeforeUnmounted,
      this.stopMonitor,
    );
    this.app.highlightTooltip.on(TooltipEvents.Mounted, this.startMonitor);
    this.app.highlightTooltip.on(TooltipEvents.Unmounted, this.startMonitor);

    this.startMonitor();
  }

  private destroyMonitor() {
    if (!this.domMonitor) {
      throw new Error('no monitor');
    }

    this.stopMonitor();
    this.domMonitor = undefined;
    this.app.highlightTooltip.off(TooltipEvents.BeforeMount, this.stopMonitor);
    this.app.highlightTooltip.off(TooltipEvents.Mounted, this.startMonitor);
  }

  private stopMonitor = () => {
    if (!this.domMonitor) {
      return;
    }

    this.domMonitor.disconnect();
  };

  private startMonitor = () => {
    if (!this.domMonitor) {
      return;
    }

    this.domMonitor.observe(document.body, { subtree: true, childList: true });
  };
}
