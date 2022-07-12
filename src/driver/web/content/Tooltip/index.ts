import debounce from 'lodash.debounce';
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

    const tooltipDisabled = !this.markManager.isAvailableRange(selection.range);
    const { x, y, reversed } = getSelectionEndPosition();

    this.rootEl.innerHTML = renderTooltip({
      colors: COLORS,
      disabled: tooltipDisabled,
    });
    this.rootEl.style.left = `${x + (reversed ? -10 : 10)}px`;
    this.rootEl.style.top = `${y + (reversed ? -10 : 10)}px`;
    document.body.appendChild(this.rootEl);
    document.addEventListener('click', this.handleClickOut);
  };

  private unmount = () => {
    document.removeEventListener('click', this.handleClickOut);
    this.rootEl.remove();
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

  static init(markManager: MarkManager) {
    const tooltip = new Tooltip(markManager);
    document.addEventListener('selectionchange', tooltip.unmount);
    document.addEventListener('selectionchange', debounce(tooltip.mount, 500));
    window.addEventListener('scroll', debounce(tooltip.unmount, 1000));

    return tooltip;
  }
}
