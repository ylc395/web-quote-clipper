import EventEmitter from 'eventemitter3';
import { MARK_CLASS_NAME, MARK_QUOTE_ID_DATASET_KEY_CAMEL } from './constants';
import type App from '../App';
import { TooltipEvents } from '../HighlightTooltip';
import { isElement } from '../utils';

export enum DomMonitorEvents {
  QuoteRemoved = 'QUOTE_REMOVED',
  ContentAdded = 'CONTENT_ADDED',
}

export default class DomMonitor extends EventEmitter<DomMonitorEvents> {
  private isListeningHighlightTooltip = false;
  private readonly domMonitor = this.createDomMonitor();

  constructor(private readonly app: App) {
    super();
  }

  start = (needListener = false) => {
    this.domMonitor.observe(document.body, { subtree: true, childList: true });

    if (needListener && !this.isListeningHighlightTooltip) {
      this.isListeningHighlightTooltip = true;
      this.app.highlightTooltip.on(TooltipEvents.BeforeMount, this.stop);
      this.app.highlightTooltip.on(TooltipEvents.Mounted, this.start);
      this.app.highlightTooltip.on(TooltipEvents.BeforeUnmounted, this.stop);
      this.app.highlightTooltip.on(TooltipEvents.Unmounted, this.start);
    }
  };

  stop = (needRemoveListener = false) => {
    this.domMonitor.disconnect();

    if (needRemoveListener && this.isListeningHighlightTooltip) {
      this.isListeningHighlightTooltip = false;
      this.app.highlightTooltip.off(TooltipEvents.BeforeMount, this.stop);
      this.app.highlightTooltip.off(TooltipEvents.Mounted, this.start);
      this.app.highlightTooltip.off(TooltipEvents.BeforeUnmounted, this.stop);
      this.app.highlightTooltip.off(TooltipEvents.Unmounted, this.start);
    }
  };

  private createDomMonitor() {
    return new MutationObserver((mutationList) => {
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
          const quoteId = markEl.dataset[MARK_QUOTE_ID_DATASET_KEY_CAMEL];

          if (!quoteId) {
            throw new Error('no quote id');
          }

          this.emit(DomMonitorEvents.QuoteRemoved, quoteId);
        }
      }

      if (addedElements.length > 0) {
        this.emit(DomMonitorEvents.ContentAdded);
      }
    });
  }
}
