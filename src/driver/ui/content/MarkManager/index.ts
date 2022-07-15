import highlightRange from 'dom-highlight-range';
import Mark from 'mark.js';
import type { Quote } from 'model/entity';
import { getQuotes } from 'driver/ui/fetcher';
import type App from '../App';
import { TooltipEvents } from '../Tooltip';
import './style.scss';

const MARK_CLASSNAME = 'web-clipper-mark';
let id = 0;
const generateId = () => String(++id);

export default class MarkManager {
  private pen = new Mark(document.body);
  private quotesToConsumed?: Quote[];
  private domMonitor?: MutationObserver;
  private constructor(private readonly app: App) {}

  isAvailableRange(range: Range) {
    const marks = Array.from(document.querySelectorAll(`.${MARK_CLASSNAME}`));
    return marks.every((el) => !range.intersectsNode(el));
  }

  private activate = async () => {
    if (!this.quotesToConsumed) {
      try {
        this.quotesToConsumed = await getQuotes({
          url: location.href,
          contentType: 'pure',
        });
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
        window.addEventListener('load', this.activate);
      } else {
        this.initDomMonitor();
      }
    }

    if (failedQuotes.length === 0 && this.domMonitor) {
      this.destroyMonitor();
    }

    this.quotesToConsumed = failedQuotes;
  };

  highlightQuote(quote: Quote, range?: Range) {
    const quoteId = generateId();
    const className = `${MARK_CLASSNAME} ${MARK_CLASSNAME}-${quote.color}`;

    this.stopMonitor();

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
        await this.activate();
      }
    });

    this.app.tooltip.on(TooltipEvents.BeforeMount, this.stopMonitor);
    this.app.tooltip.on(TooltipEvents.BeforeUnmounted, this.stopMonitor);
    this.app.tooltip.on(TooltipEvents.Mounted, this.startMonitor);
    this.app.tooltip.on(TooltipEvents.Unmounted, this.startMonitor);

    this.startMonitor();
  }

  private destroyMonitor() {
    if (!this.domMonitor) {
      throw new Error('no monitor');
    }

    this.stopMonitor();
    this.domMonitor = undefined;
    this.app.tooltip.off(TooltipEvents.BeforeMount, this.stopMonitor);
    this.app.tooltip.off(TooltipEvents.Mounted, this.startMonitor);
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

  static init(app: App) {
    const markManager = new MarkManager(app);
    markManager.activate();
    return markManager;
  }
}
