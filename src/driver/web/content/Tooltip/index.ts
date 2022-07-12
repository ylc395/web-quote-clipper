import debounce from 'lodash.debounce';
import { postQuote } from 'driver/web/fetcher';
import {
  generateQuote,
  getSelection,
  getSelectionEndPosition,
} from './capture';
import type MarkManager from '../MarkManager';

const ROOT_ID = 'tooltip-container';

export default class Tooltip {
  private rootEl: HTMLElement;
  private styleEl: HTMLStyleElement;
  private constructor(private readonly markManager: MarkManager) {
    this.rootEl = document.createElement('div');
    this.rootEl.addEventListener('click', this.capture.bind(this));
    this.rootEl.id = ROOT_ID;
    this.rootEl.innerHTML = `<button>Quote!</button>`;

    this.styleEl = document.createElement('style');
    this.styleEl.textContent = `#${ROOT_ID} * {all: initial;} #${ROOT_ID} {position: fixed;}`;
  }

  private get buttonEl() {
    return this.rootEl.querySelector('');
  }

  private handleClickOut = (e: MouseEvent) => {
    if (!this.rootEl) {
      throw new Error('no root el');
    }

    if (!this.rootEl.contains(e.target as HTMLElement)) {
      this.unmount();
    }
  };

  private mount = () => {
    const selection = getSelection();

    if (!selection) {
      return;
    }

    const tooltipDisabled = !this.markManager.isAvailableRange(selection.range);
    const { x, y, reversed } = getSelectionEndPosition();

    this.rootEl.style.left = `${x + (reversed ? -10 : 10)}px`;
    this.rootEl.style.top = `${y + (reversed ? -10 : 10)}px`;
    document.body.appendChild(this.rootEl);
    document.head.appendChild(this.styleEl);
    document.addEventListener('click', this.handleClickOut);
  };

  private unmount = () => {
    document.removeEventListener('click', this.handleClickOut);
    this.rootEl.remove();
    this.styleEl.remove();
  };

  private async capture() {
    const selection = getSelection();

    if (!selection) {
      return;
    }

    const quote = await generateQuote(selection.range);

    if (quote) {
      await postQuote(quote);
      this.markManager.createMark(selection.range, quote);
      window.getSelection()?.empty();
    } else {
      // todo: handle no quote
    }
  }

  static init(markManager: MarkManager) {
    const tooltip = new Tooltip(markManager);
    document.addEventListener('selectionchange', tooltip.unmount);
    document.addEventListener('selectionchange', debounce(tooltip.mount, 500));

    return tooltip;
  }
}
