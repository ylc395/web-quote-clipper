import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { Colors } from 'model/entity';
import { postQuote } from 'driver/web/fetcher';
import {
  generateQuote,
  getSelection,
  getSelectionEndPosition,
} from './capture';
import renderTooltip from './template.hbs';
import type MarkManager from '../MarkManager';
import './style.scss';

const ROOT_ID = 'tooltip-container';
const COLORS = [
  Colors.Yellow,
  Colors.Green,
  Colors.Blue,
  Colors.Pink,
  Colors.Purple,
];

export default class Tooltip {
  private rootEl: HTMLElement;
  private currentSelectionEnd?: ReturnType<typeof getSelectionEndPosition>;
  private constructor(private readonly markManager: MarkManager) {
    this.rootEl = document.createElement('div');
    this.rootEl.addEventListener('click', this.handleClick.bind(this));
    this.rootEl.id = ROOT_ID;
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;

    if (!target) {
      return;
    }

    switch (true) {
      case target.matches('[data-web-clipper-color]'):
        this.capture(target.dataset.webClipperColor as Colors);
        break;
      default:
        break;
    }
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

    this.currentSelectionEnd = getSelectionEndPosition();
    const { x, y, reversed } = this.currentSelectionEnd;
    const tooltipDisabled = !this.markManager.isAvailableRange(selection.range);

    this.rootEl.innerHTML = renderTooltip({
      colors: COLORS,
      disabled: tooltipDisabled,
    });
    this.rootEl.style.left = `${x + (reversed ? -10 : 10)}px`;
    this.rootEl.style.top = `${y + (reversed ? -10 : 10)}px`;
    document.body.appendChild(this.rootEl);
    document.addEventListener('click', this.handleClickOut);
    window.addEventListener('scroll', this.checkAndUnmount);
  };

  private unmount = () => {
    if (!this.currentSelectionEnd) {
      return;
    }

    document.removeEventListener('click', this.handleClickOut);
    window.removeEventListener('scroll', this.checkAndUnmount);
    this.rootEl.remove();
    this.currentSelectionEnd = undefined;
  };

  private async capture(color: Colors) {
    const selection = getSelection();

    if (!selection) {
      return;
    }

    const quote = await generateQuote(selection.range, color);

    if (quote) {
      await postQuote(quote);
      this.markManager.createMark(selection.range, quote);
      window.getSelection()?.empty();
    } else {
      // todo: handle no quote
    }
  }

  private checkAndUnmount = throttle(() => {
    if (!this.currentSelectionEnd) {
      return;
    }

    const { y } = this.rootEl.getBoundingClientRect();
    const tooltipOffsetY = y + window.scrollY;

    if (Math.abs(tooltipOffsetY - this.currentSelectionEnd.offsetY) > 150) {
      this.unmount();
    }
  }, 500);

  static init(markManager: MarkManager) {
    const tooltip = new Tooltip(markManager);
    document.addEventListener('selectionchange', tooltip.unmount);
    document.addEventListener('selectionchange', debounce(tooltip.mount, 500));

    return tooltip;
  }
}
