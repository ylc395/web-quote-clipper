import EventEmitter from 'eventemitter3';
import { singleton } from 'tsyringe';
import { MARK_CLASS_NAME, MARK_QUOTE_ID_DATASET_KEY_CAMEL } from './constants';
import { isElement, isVisible } from '../utils';

export enum DomMonitorEvents {
  QuoteRemoved = 'QUOTE_REMOVED',
  ContentAdded = 'CONTENT_ADDED',
}

@singleton()
export default class DomMonitor extends EventEmitter<DomMonitorEvents> {
  private readonly domMonitor = this.createDomMonitor();
  private readonly removedQuoteIds: string[] = [];
  private waitingTokens = new Set<Symbol>();

  constructor() {
    super();
  }

  start = (token?: Symbol) => {
    if (token) {
      this.waitingTokens.delete(token);
    }

    if (this.waitingTokens.size > 0) {
      return;
    }

    this.domMonitor.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    console.log('👀 DOM monitor start');
  };

  stop = (needToken = false) => {
    this.domMonitor.disconnect();

    if (needToken) {
      const token = Symbol();
      this.waitingTokens.add(token);

      return token;
    }

    console.log('👀 DOM monitor stop');
  };

  private createDomMonitor() {
    return new MutationObserver((mutationList) => {
      const added: Node[] = [];
      const removed: HTMLElement[] = [];
      const attrs: string[] = [];

      for (const {
        addedNodes,
        removedNodes,
        attributeName,
        target,
      } of mutationList) {
        added.push(...addedNodes);
        removed.push(...Array.from(removedNodes).filter(isElement));

        if (attributeName && !attributeName.startsWith('data-popper')) {
          isVisible(target)
            ? this.emit(DomMonitorEvents.ContentAdded)
            : removed.push(target as HTMLElement);
          attrs.push(attributeName);
        }
      }

      console.log('➕ nodes added:', added);
      console.log('🚮 nodes removed:', removed);
      console.log('🚮 attr updates:', attrs);

      const selector = `.${MARK_CLASS_NAME}`;

      for (const el of removed) {
        const markEls = el.matches(selector)
          ? Array.of(el)
          : (Array.from(el.querySelectorAll(selector)) as HTMLElement[]);

        for (const markEl of markEls) {
          console.log('🚮 markEl removed:', markEl);
          const quoteId = markEl.dataset[MARK_QUOTE_ID_DATASET_KEY_CAMEL];

          if (!quoteId) {
            throw new Error('no quote id');
          }

          if (!this.removedQuoteIds.includes(quoteId)) {
            this.emit(DomMonitorEvents.QuoteRemoved, quoteId);
            this.removedQuoteIds.push(quoteId);
          }
        }
      }

      if (added.length > 0) {
        this.emit(DomMonitorEvents.ContentAdded);
      }
    });
  }
}
