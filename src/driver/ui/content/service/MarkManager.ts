import highlightRange from 'dom-highlight-range';
import { container, singleton } from 'tsyringe';
import Mark from 'mark.js';
import debounce from 'lodash.debounce';
import { shallowReactive, shallowRef, watch, computed, reactive } from 'vue';

import type { Quote } from 'model/entity';
import { DbTypes } from 'model/db';
import type { AppConfig } from 'model/config';
import ConfigService, { ConfigEvents } from 'service/ConfigService';
import webExtension from './extensionService';
import * as joplinService from 'driver/ui/common/service/joplinService';
import repository from './repository';

import DomMonitor, { DomMonitorEvents } from './DomMonitor';
import {
  MARK_CLASS_NAME,
  MARK_QUOTE_ID_DATASET_KEY,
  MARK_QUOTE_ID_DATASET_KEY_CAMEL,
} from './constants';
import { copyQuoteToClipboard, isVisible, getUrlPath, noop } from '../utils';
import type { OperationTypes } from 'model/config';

const UNPERSISTED_CLASS_NAME = `${MARK_CLASS_NAME}-unpersisted`;
const REFRESH_DELAY = 2000; // not sure what's the best interval

let id = 0;
const generateCid = () => String(++id);
const getQuery = () =>
  ({
    url: location.href,
    contentType: 'pure',
    orderBy: 'contentLength',
  } as const);

@singleton()
export default class MarkManager {
  private readonly config = container.resolve(ConfigService);
  private pen = new Mark(document.body);
  readonly matchedQuotesMap: Record<string, Quote> = reactive({});
  readonly tooltipTargetMap: Record<string, HTMLElement> = shallowReactive({});
  readonly commentMap: Record<string, boolean> = shallowReactive({});
  readonly domMonitor = new DomMonitor();
  private readonly unmatchedQuotes = shallowRef<Quote[]>([]);
  private readonly activeMarkCount = computed(() => {
    return Object.keys(this.matchedQuotesMap).length;
  });
  private readonly totalMarkCount = computed(
    () => this.unmatchedQuotes.value.length + this.activeMarkCount.value,
  );
  private isHighlighting = false;
  private lastUrl = getUrlPath(location.href);

  constructor() {
    this.domMonitor.on(DomMonitorEvents.ContentAdded, this.highlightAll); // todo: maybe we don't need to try to match among the whole page every time
    this.domMonitor.on(DomMonitorEvents.QuoteRemoved, this.removeQuoteByCid);
    window.addEventListener('focus', this.refresh);
    this.config.on(ConfigEvents.Updated, (patch: Partial<AppConfig>) => {
      if (patch.db) {
        this.reset();
      }
    });

    watch(this.activeMarkCount, (newValue, oldValue) => {
      if (newValue !== 0 && oldValue === 0) {
        document.addEventListener('mouseover', this.tryToMount);
      }

      if (newValue === 0 && oldValue !== 0) {
        document.removeEventListener('mouseover', this.tryToMount);
      }
    });

    watch([this.activeMarkCount, this.totalMarkCount], this.updateBadgeText);
    watch(
      this.activeMarkCount,
      debounce(
        // this will fail if popup not opened. Just ignore it.
        () => webExtension.updateMatched(this.getMatchedQuoteIds()).catch(noop),
        500,
      ),
    );

    this.init();
  }

  refresh = debounce(async () => {
    if ((await this.config.get('db')) !== DbTypes.Joplin) {
      return;
    }

    console.log('???? hydrating...');

    const existedQuotes = await repository.fetchQuotes(getQuery());
    const updatedCids: string[] = [];
    const unmatchedQuotes: Quote[] = [];
    const existedQuoteCids = Object.keys(this.matchedQuotesMap);

    for (const quote of existedQuotes) {
      let matched = false;
      for (const cid of existedQuoteCids) {
        if (this.matchedQuotesMap[cid].id === quote.id) {
          if (!this.matchedQuotesMap[cid].note) {
            MarkManager.getMarkElsByQuoteId(cid).forEach((el) =>
              el.classList.remove(UNPERSISTED_CLASS_NAME),
            );
          }
          this.matchedQuotesMap[cid] = quote;
          updatedCids.push(cid);
          matched = true;
          break;
        }
      }

      if (!matched) {
        unmatchedQuotes.push(quote);
      }
    }

    const unpersistedQuoteCids = existedQuoteCids.filter(
      (id) => !updatedCids.includes(id),
    );

    for (const cid of unpersistedQuoteCids) {
      this.matchedQuotesMap[cid].note = undefined;
      MarkManager.getMarkElsByQuoteId(cid).forEach((el) =>
        el.classList.add(UNPERSISTED_CLASS_NAME),
      );
    }

    this.unmatchedQuotes.value = unmatchedQuotes;
    this.highlightAll();
  }, REFRESH_DELAY);

  handleUrlUpdated = (url: string) => {
    const newUrl = getUrlPath(url);

    if (newUrl !== this.lastUrl) {
      this.lastUrl = newUrl;
      this.highlightAll.cancel();
      this.reset();
    }
  };

  private reset = debounce(() => {
    console.log('???? reset...');
    this.domMonitor.stop();
    this.pen = new Mark(document.body);
    this.unmatchedQuotes.value = [];

    for (const cid of Object.keys(this.matchedQuotesMap)) {
      this.removeQuoteByCid(cid);
    }

    this.domMonitor.stop();
    const allMarkEls = document.querySelectorAll(`.${MARK_CLASS_NAME}`);
    [...allMarkEls].forEach((el) => el.replaceWith(...el.childNodes));
    this.domMonitor.start();

    this.init();
  }, 500);

  private async init() {
    console.log('???? Fetching quotes...');

    try {
      const quotes = await repository.fetchQuotes(getQuery());

      this.unmatchedQuotes.value = quotes;

      if (quotes.length > 0) {
        this.domMonitor.start();
        await this.highlightAll();
      }

      this.updateBadgeText();
    } catch (error) {
      // todo: handle error
      console.error(error);
      return;
    }
  }

  private tryToMount = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains(MARK_CLASS_NAME)) {
      const markEl = target;
      const quoteId = markEl.dataset[MARK_QUOTE_ID_DATASET_KEY_CAMEL];

      if (!quoteId || !this.matchedQuotesMap[quoteId]) {
        throw new Error('no quote');
      }

      if (this.tooltipTargetMap[quoteId] || this.commentMap[quoteId]) {
        return;
      }

      this.tooltipTargetMap[quoteId] = markEl;
    }
  };

  private highlightAll = debounce(async () => {
    if (this.isHighlighting) {
      this.highlightAll();
      return;
    }

    console.log(`???? ${this.unmatchedQuotes.value.length} to highlight`);
    this.isHighlighting = true;

    if (this.unmatchedQuotes.value.length === 0) {
      this.isHighlighting = false;
      return;
    }

    const failedQuotes: Quote[] = [];

    for (const quote of this.unmatchedQuotes.value) {
      const isSuccessful = await this.highlightQuote(quote);

      if (!isSuccessful) {
        failedQuotes.push(quote);
      }
    }

    console.log(
      `${failedQuotes.length > 0 ? '????' : '????'} highlightAll failed: ${
        failedQuotes.length
      }`,
    );

    this.unmatchedQuotes.value = failedQuotes;
    this.isHighlighting = false;
  }, 500);

  private updateBadgeText = debounce(() => {
    webExtension.setBadgeText({
      total: this.totalMarkCount.value,
      active: this.activeMarkCount.value,
    });
  }, 500);

  async highlightQuote(
    quote: Quote,
    option?: { range: Range; isPersisted: boolean },
  ) {
    const quoteId = generateCid();
    const className = `${MARK_CLASS_NAME} ${MARK_CLASS_NAME}-${quote.color}`;

    const result = await new Promise<boolean>((resolve) => {
      if (option) {
        this.domMonitor.stop();
        highlightRange(option.range, 'mark', {
          class:
            className +
            (option.isPersisted ? '' : ` ${UNPERSISTED_CLASS_NAME}`),
          [MARK_QUOTE_ID_DATASET_KEY]: quoteId,
        });
        this.domMonitor.start();
        resolve(true);
      } else {
        setTimeout(() => {
          this.domMonitor.stop();
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
            filter: (node) => {
              const good = isVisible(node);

              if (!good) {
                console.log('???? filtered node:', node);
              }

              return good;
            },
            done: (count) => {
              resolve(count > 0);
              this.domMonitor.start();
            },
          });
        }, 50);
      }
    });

    if (result) {
      console.log('???? highlight success');
      this.matchedQuotesMap[quoteId] = quote;
    }

    return result;
  }

  private removeQuoteByCid = (cid: string) => {
    const quote = this.matchedQuotesMap[cid];

    if (!quote) {
      throw Error('no quote when delete');
    }

    delete this.matchedQuotesMap[cid];
    console.log(`???? quote removed: ${cid}`);

    const relatedEls = MarkManager.getMarkElsByQuoteId(cid);
    this.domMonitor.stop();
    relatedEls.forEach((el) => el.replaceWith(...el.childNodes));

    if (this.totalMarkCount.value > 0) {
      this.domMonitor.start();
    }

    return quote;
  };

  updateQuote = async (cid: string, quote: Partial<Quote>) => {
    const oldQuote = this.matchedQuotesMap[cid];
    const newQuote = { ...oldQuote, ...quote };

    await repository.updateQuote(newQuote);

    this.matchedQuotesMap[cid] = newQuote;

    if (oldQuote.color !== newQuote.color) {
      this.domMonitor.stop();
      MarkManager.getMarkElsByQuoteId(cid).forEach((el) => {
        el.classList.remove(`${MARK_CLASS_NAME}-${oldQuote.color}`);
        el.classList.add(`${MARK_CLASS_NAME}-${newQuote.color}`);
      });
      this.domMonitor.start();
    }
  };

  deleteQuote = async (quote: string | Quote) => {
    const cid = typeof quote === 'string' ? quote : this.getQuoteCid(quote);
    const _quote = this.matchedQuotesMap[cid];

    if ((await this.config.get('db')) !== DbTypes.Joplin || _quote.note) {
      await repository.deleteQuote(_quote);
    }

    this.removeQuoteByCid(cid);
  };

  static getMarkElsByQuoteId(cid: string) {
    return Array.from(
      document.querySelectorAll(
        `.${MARK_CLASS_NAME}[${MARK_QUOTE_ID_DATASET_KEY}="${cid}"]`,
      ),
    ) as HTMLElement[];
  }

  toggleMarkHover = (cid: string) => {
    this.domMonitor.stop();
    MarkManager.getMarkElsByQuoteId(cid).forEach((el) =>
      el.classList.toggle('web-clipper-mark-hover'),
    );
    this.domMonitor.start();
  };

  jumpToJoplin = (id: string) => {
    const quote = this.matchedQuotesMap[id];

    if (!quote || !quote.note) {
      throw new Error('no quote');
    }

    joplinService.openNote(quote.note.id);
  };

  copyAs = async (
    cid: string,
    type: OperationTypes.ClipboardBlock | OperationTypes.ClipboardInline,
  ) => {
    const quote = this.matchedQuotesMap[cid];
    await copyQuoteToClipboard(quote, type);
  };

  scrollToMark = (quote: Quote) => {
    const cid = this.getQuoteCid(quote);
    const el = MarkManager.getMarkElsByQuoteId(cid)[0];
    el.scrollIntoView();
  };

  private getQuoteCid = (quote: Quote) => {
    const matchedQuotes = Object.entries(this.matchedQuotesMap);
    const target = matchedQuotes.find(([_, { id }]) => quote.id === id);

    if (!target) {
      throw new Error('can not find quote');
    }

    return target[0];
  };

  getMatchedQuoteIds = () => {
    return Object.values(this.matchedQuotesMap).map(({ id }) => id);
  };
}
