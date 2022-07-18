import { createPopper, Instance } from '@popperjs/core';
import type { Quote } from 'model/entity';
import { deleteQuote } from 'driver/ui/request';
import renderTooltip from './template.hbs';

const TOOLTIP_CLASS_NAME = 'web-clipper-mark-tooltip';

interface Options {
  quote: Quote;
  baseEl: HTMLElement;
  relatedEls: HTMLElement[];
  onUnmount: () => void;
  onDelete: () => void;
}

export default class MarkTooltip {
  private rootEl;
  private popper?: Instance;
  private readonly options: Options;
  constructor(options: Options) {
    this.options = options;
    this.rootEl = document.createElement('div');
    this.rootEl.classList.add(TOOLTIP_CLASS_NAME);
    this.rootEl.addEventListener('click', this.handleClick);

    this.mount();
  }

  private mount() {
    this.rootEl.innerHTML = renderTooltip({});
    document.body.appendChild(this.rootEl);
    this.popper = createPopper(this.options.baseEl, this.rootEl, {
      placement: 'top',
    });
    document.addEventListener('mouseout', this.handleMouseout);
  }

  private unmount() {
    if (!this.popper) {
      throw new Error('no tippy');
    }
    this.popper.destroy();
    this.popper = undefined;

    document.removeEventListener('mouseout', this.handleMouseout);
    this.options.onUnmount();
  }

  private handleClick = async (e: MouseEvent) => {
    switch ((e.target as HTMLElement).className) {
      case 'web-clipper-delete-button':
        await this.deleteQuote();
        this.unmount();
        return;
      default:
        break;
    }
  };

  private async deleteQuote() {
    await deleteQuote(this.options.quote);
    this.options.onDelete();
  }

  private handleMouseout = (e: MouseEvent) => {
    if (!this.popper) {
      throw new Error('no tippy');
    }

    const relatedTarget = e.relatedTarget as HTMLElement;
    const isStillInMark =
      this.options.baseEl.contains(relatedTarget) ||
      this.popper.state.elements.popper.contains(relatedTarget) ||
      this.options.relatedEls.some((el) => el.contains(relatedTarget));

    if (!isStillInMark) {
      this.unmount();
    }
  };
}