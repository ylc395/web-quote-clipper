import EventEmitter from 'eventemitter3';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { Colors } from 'model/entity';
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
const COLORS = [
  Colors.Yellow,
  Colors.Green,
  Colors.Blue,
  Colors.Pink,
  Colors.Purple,
];

export enum TooltipEvents {
  BeforeMount = 'BEFORE_MOUNT',
  Mounted = 'MOUNTED',
  BeforeUnmounted = 'BEFORE_UNMOUNT',
  Unmounted = 'UNMOUNTED',
}

export default class Tooltip extends EventEmitter {
  private rootEl: HTMLElement;
  private currentSelectionEnd?: ReturnType<typeof getSelectionEndPosition>;
  constructor(private readonly app: App) {
    super();
    this.rootEl = document.createElement('div');
    this.rootEl.addEventListener('click', this.handleClick.bind(this));
    this.rootEl.id = ROOT_ID;

    document.addEventListener('selectionchange', this.unmount);
    document.addEventListener('selectionchange', debounce(this.mount, 500));
  }

  private handleClick(e: MouseEvent) {
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
    const range = getSelectionRange();

    if (!range) {
      return;
    }

    this.emit(TooltipEvents.BeforeMount);

    this.currentSelectionEnd = getSelectionEndPosition();
    const { x, y, reversed } = this.currentSelectionEnd;
    const tooltipDisabled = !this.app.markManager.isAvailableRange(range);

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
    document.addEventListener('mousedown', this.handleClickOut);
    window.addEventListener('scroll', this.checkAndUnmount);

    this.emit(TooltipEvents.Mounted);
  };

  private unmount = () => {
    if (!this.currentSelectionEnd) {
      return;
    }

    this.emit(TooltipEvents.BeforeUnmounted);

    document.removeEventListener('mousedown', this.handleClickOut);
    window.removeEventListener('scroll', this.checkAndUnmount);

    this.rootEl.className = '';
    this.rootEl.remove();
    this.currentSelectionEnd = undefined;

    this.emit(TooltipEvents.Unmounted);
  };

  private async capture(color: Colors) {
    const range = getSelectionRange();

    if (!range) {
      return;
    }

    const quote = await generateQuote(range, color);

    if (!quote) {
      return;
    }

    try {
      await postQuote(quote);
    } catch (error) {
      // todo: handle error
      alert(error);
      return;
    }

    this.app.markManager.highlightQuote(quote, range);
    window.getSelection()?.empty();
  }

  private checkAndUnmount = throttle(() => {
    if (!this.currentSelectionEnd) {
      return;
    }

    const { y } = this.rootEl.getBoundingClientRect();
    const tooltipOffsetY = y + window.scrollY;

    if (Math.abs(tooltipOffsetY - this.currentSelectionEnd.offsetY) > 100) {
      this.unmount();
    }
  }, 500);
}
