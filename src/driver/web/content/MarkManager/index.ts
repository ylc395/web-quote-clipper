import highlightRange from 'dom-highlight-range';
import Mark from 'mark.js';
import type { Quote } from 'model/entity';
import { getQuotes } from 'driver/web/fetcher';
import './style.scss';

const MARK_CLASSNAME = 'web-clipper-mark';
let id = 0;
const generateId = () => String(++id);

export default class MarkManager {
  private pen = new Mark(document.body);
  private quotesToConsumed?: Quote[];
  private domMonitor?: MutationObserver;

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
        this.monitorDomChanging();
      }
    }

    if (failedQuotes.length === 0 && this.domMonitor) {
      this.domMonitor.disconnect();
      this.domMonitor = undefined;
    }

    this.quotesToConsumed = failedQuotes;
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

  private monitorDomChanging() {
    if (this.domMonitor) {
      return;
    }

    this.domMonitor = new MutationObserver(async (mutationList) => {
      if (!this.quotesToConsumed) {
        throw new Error('no quotes to consume');
      }

      for (const { addedNodes } of mutationList) {
        // we assumed that a quote won't cross existing node and added node
        await this.changePen(addedNodes);
      }
    });

    this.domMonitor.observe(document.body, { subtree: true, childList: true });
  }

  private async changePen(context: NodeList) {
    this.pen = new Mark(context);
    await this.activate();
  }

  static init() {
    const markManager = new MarkManager();
    markManager.activate();
    return markManager;
  }
}
