import { createPopper, Instance } from '@popperjs/core';
import type { Quote } from 'model/entity';
import { deleteQuote } from 'driver/ui/request';
import renderTooltip from './template.hbs';
import { getAncestor } from '../../utils';

const TOOLTIP_CLASS_NAME = 'web-clipper-mark-manager-tooltip';
const BUTTON_CLASS_NAME = 'web-clipper-mark-manager-tooltip-button';

interface Options {
  quote: Quote;
  targetEl: HTMLElement;
  relatedEls: HTMLElement[];
  onBeforeUnmount: () => void;
  onUnmounted: () => void;
  onDelete: () => void;
}

export default class MarkTooltip {
  private rootEl;
  private popper?: Instance;
  private baseEl?: HTMLElement;
  private readonly options: Options;
  constructor(options: Options) {
    this.options = options;
    this.rootEl = document.createElement('div');
    this.rootEl.classList.add(TOOLTIP_CLASS_NAME);
    this.rootEl.addEventListener('click', this.handleClick);

    this.mount();
  }

  private mount() {
    this.baseEl = this.findBaseEl();
    this.rootEl.innerHTML = renderTooltip({});
    document.body.appendChild(this.rootEl);
    this.popper = createPopper(this.baseEl, this.rootEl, {
      placement: 'top',
    });
    document.addEventListener('mouseout', this.handleMouseout);
  }

  private findBaseEl() {
    const { targetEl, relatedEls } = this.options;
    const firstEl = relatedEls[0];

    return Math.abs(
      firstEl.getBoundingClientRect().top -
        targetEl.getBoundingClientRect().top,
    ) > 200
      ? targetEl
      : firstEl;
  }

  private unmount() {
    if (!this.popper) {
      throw new Error('no tippy');
    }
    this.options.onBeforeUnmount();
    this.popper.destroy();
    this.popper = undefined;
    this.rootEl.remove();
    document.removeEventListener('mouseout', this.handleMouseout);
    this.options.onUnmounted();
  }

  private handleClick = async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const mainButtonEl = target.matches(`.${BUTTON_CLASS_NAME}`)
      ? target
      : getAncestor(target, `.${BUTTON_CLASS_NAME}`, this.rootEl);

    if (!mainButtonEl) {
      return;
    }

    switch (mainButtonEl.dataset.type) {
      case 'delete':
        await this.deleteQuote();
        return this.unmount();
      default:
        break;
    }
  };

  private async deleteQuote() {
    await deleteQuote(this.options.quote);
    this.options.onDelete();
  }

  private handleMouseout = (e: MouseEvent) => {
    if (!this.popper || !this.baseEl) {
      throw new Error('not mounted');
    }

    const relatedTarget = e.relatedTarget as HTMLElement;
    const isStillInMark =
      this.baseEl.contains(relatedTarget) ||
      this.popper.state.elements.popper.contains(relatedTarget) ||
      this.options.relatedEls.some((el) => el.contains(relatedTarget));

    if (!isStillInMark) {
      this.unmount();
    }
  };
}
