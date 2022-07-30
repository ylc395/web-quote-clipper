import EventEmitter from 'eventemitter3';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { Colors, COLORS } from 'model/entity';
import { postQuote } from 'driver/ui/request';
import {
  generateQuote,
  getSelectionRange,
  getSelectionEndPosition,
} from './selection';
import renderTooltip from './template.hbs';
import type App from '../App';
import './style.scss';

const ROOT_ID = 'web-clipper-tooltip-container';

export enum TooltipEvents {
  BeforeMount = 'BEFORE_MOUNT',
  Mounted = 'MOUNTED',
  BeforeUnmount = 'BEFORE_UNMOUNT',
  Unmounted = 'UNMOUNTED',
}

export default class HighlightTooltip extends EventEmitter {
  private rootEl: HTMLElement;
  private rootElRect?: DOMRect;
  private currentRange?: ReturnType<typeof getSelectionRange>;

  constructor(private readonly app: App) {
    super();
    this.rootEl = document.createElement('div');
    this.rootEl.addEventListener('click', this.handleClick);
    this.rootEl.id = ROOT_ID;

    document.addEventListener('selectionchange', debounce(this.mount, 500));
  }

  private handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;

    if (!target) {
      return;
    }

    switch (true) {
      case target.matches('button[data-web-clipper-color]'):
        return this.capture(target.dataset.webClipperColor as Colors);
      default:
        break;
    }
  };

  private mount = () => {
    this.currentRange = getSelectionRange();

    if (!this.currentRange) {
      return;
    }

    this.emit(TooltipEvents.BeforeMount);

    const { range, reversed } = this.currentRange;
    const { x, y } = getSelectionEndPosition(range, reversed);

    const tooltipDisabled =
      !this.app.markManager.isAvailableRange(range) || !range.toString().trim();

    this.rootEl.innerHTML = renderTooltip({
      colors: COLORS,
      disabled: tooltipDisabled,
    });
    this.rootEl.style.left = `${x + (reversed ? -10 : 10)}px`;
    this.rootEl.style.top = `${y + (reversed ? -10 : 10)}px`;

    if (reversed) {
      this.rootEl.className = `${ROOT_ID}-reversed`;
    }

    document.body.appendChild(this.rootEl);
    this.rootElRect = this.rootEl.getBoundingClientRect();

    document.addEventListener('selectionchange', this.unmount);
    document.addEventListener('scroll', this.toggleWhenScroll, true);

    this.emit(TooltipEvents.Mounted);
  };

  private unmount = () => {
    this.emit(TooltipEvents.BeforeUnmount);

    document.removeEventListener('scroll', this.toggleWhenScroll, true);
    document.removeEventListener('selectionchange', this.unmount);

    this.rootEl.className = '';
    this.rootEl.remove();
    this.rootEl.removeAttribute('style');

    this.currentRange = undefined;
    this.rootElRect = undefined;

    this.emit(TooltipEvents.Unmounted);
  };

  private async capture(color: Colors) {
    if (!this.currentRange) {
      throw new Error('no range');
    }

    const { range } = this.currentRange;
    const result = await generateQuote(range, color);

    if (!result) {
      return;
    }

    try {
      const createdQuote = await postQuote(result.quote);
      this.app.markManager.highlightQuote(createdQuote, result.range);
      window.getSelection()?.empty(); // tip: this will trigger `selectionchange`
    } catch (error) {
      // todo: handle error
      console.error(error);
      return;
    }
  }

  private toggleWhenScroll = throttle(() => {
    if (!this.rootElRect || !this.currentRange) {
      throw new Error('no rootElRect');
    }

    const { height: tooltipHeight, y: tooltipY } = this.rootElRect;
    const { height: rangeHeight, y: rangeY } =
      this.currentRange.range.getBoundingClientRect();

    if (
      rangeY - (tooltipHeight + tooltipY) > 80 ||
      tooltipY - (rangeY + rangeHeight) > 80
    ) {
      this.rootEl.style.display = 'none';
    } else {
      this.rootEl.style.display = 'flex';
    }
  }, 300);
}
