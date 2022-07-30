import EventEmitter from 'eventemitter3';
import { MARK_CLASS_NAME, MARK_QUOTE_ID_DATASET_KEY_CAMEL } from './constants';
import type App from '../App';
import { TooltipEvents } from '../HighlightTooltip';
import { isElement, isVisible } from '../utils';

export enum DomMonitorEvents {
  QuoteRemoved = 'QUOTE_REMOVED',
  ContentAdded = 'CONTENT_ADDED',
}

export default class DomMonitor extends EventEmitter<DomMonitorEvents> {
  private isListeningHighlightTooltip = false;
  private readonly domMonitor = this.createDomMonitor();
  private readonly removedQuoteIds: string[] = [];

  constructor() {
    super();
  }

  private stopSimply = () => {
    console.log('👀 DOM monitor stop simply');
    this.domMonitor.disconnect();
  };

  start = () => {
    this.domMonitor.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    if (!this.isListeningHighlightTooltip) {
      this.isListeningHighlightTooltip = true;
      // this.app.highlightTooltip.on(TooltipEvents.BeforeMount, this.stopSimply);
      // this.app.highlightTooltip.on(TooltipEvents.Mounted, this.start);
      // this.app.highlightTooltip.on(
      //   TooltipEvents.BeforeUnmount,
      //   this.stopSimply,
      // );
      // this.app.highlightTooltip.on(TooltipEvents.Unmounted, this.start);
    }

    console.log('👀 DOM monitor start');
  };

  stop = () => {
    this.domMonitor.disconnect();

    if (this.isListeningHighlightTooltip) {
      this.isListeningHighlightTooltip = false;
      // this.app.highlightTooltip.off(TooltipEvents.BeforeMount, this.stopSimply);
      // this.app.highlightTooltip.off(TooltipEvents.Mounted, this.start);
      // this.app.highlightTooltip.off(
      //   TooltipEvents.BeforeUnmount,
      //   this.stopSimply,
      // );
      // this.app.highlightTooltip.off(TooltipEvents.Unmounted, this.start);
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

        if (attributeName) {
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
