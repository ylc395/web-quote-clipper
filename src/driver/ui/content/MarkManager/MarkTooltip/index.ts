import { createPopper, Instance, main } from '@popperjs/core';
import { Quote, COLORS, Colors } from 'model/entity';
import renderTooltip from './template.hbs';
import { getAncestor } from '../../utils';
import './style.scss';

const TOOLTIP_CLASS_NAME = 'web-clipper-mark-manager-tooltip';
const BUTTON_CLASS_NAME = 'web-clipper-mark-manager-main-button';
const COLORS_CLASS_NAME = 'web-clipper-mark-manager-colors';
const COMMENT_CLASS_NAME = 'web-clipper-mark-manager-comment';
const MARK_HOVER_CLASS_NAME = 'web-clipper-mark-hover';

interface Options {
  id: string;
  quote: Quote;
  targetEl: HTMLElement;
  relatedEls: HTMLElement[];
  onBeforeUnmount: () => void;
  onUnmounted: () => void;
  onDelete: (quoteId: string) => void;
  onUpdate: (quoteId: string, newQuote: Quote) => void;
}

export default class MarkTooltip {
  private rootEl;
  private popper?: Instance;
  private baseEl?: HTMLElement;
  private submenuRoots?: {
    color: HTMLElement;
    comment: HTMLElement;
  };

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
    this.rootEl.innerHTML = renderTooltip({
      colors: COLORS.filter((c) => c !== this.options.quote.color),
    });
    this.submenuRoots = {
      color: this.rootEl.querySelector(`.${COLORS_CLASS_NAME}`)!,
      comment: this.rootEl.querySelector(`.${COMMENT_CLASS_NAME}`)!,
    };
    this.options.relatedEls.forEach((el) =>
      el.classList.add(MARK_HOVER_CLASS_NAME),
    );
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
    this.submenuRoots = undefined;
    this.options.relatedEls.forEach((el) =>
      el.classList.remove(MARK_HOVER_CLASS_NAME),
    );
    document.removeEventListener('mouseout', this.handleMouseout);
    this.options.onUnmounted();
  }

  private handleClick = async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const { id, quote } = this.options;

    if (target.dataset.webClipperColor) {
      await this.options.onUpdate(id, {
        ...quote,
        color: target.dataset.webClipperColor as Colors,
      });
      return this.unmount();
    }

    const mainButtonEl = target.matches(`.${BUTTON_CLASS_NAME}`)
      ? target
      : getAncestor(target, `.${BUTTON_CLASS_NAME}`, this.rootEl);

    if (!mainButtonEl) {
      return;
    }

    switch (mainButtonEl.dataset.type) {
      case 'delete':
        await this.options.onDelete(this.options.id);
        return this.unmount();
      case 'color':
      case 'comment':
        return this.toggleSubmenu(mainButtonEl.dataset.type);
      default:
        break;
    }
  };

  private toggleSubmenu(type: 'color' | 'comment') {
    if (!this.submenuRoots) {
      throw new Error('no submenuRoots');
    }

    const rootEl = this.submenuRoots[type];
    const display = rootEl.style.display === 'none' ? 'block' : 'none';
    rootEl.style.display = display;

    for (const el of Object.values(this.submenuRoots).filter(
      (el) => el !== rootEl,
    )) {
      el.style.display = 'none';
    }
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
