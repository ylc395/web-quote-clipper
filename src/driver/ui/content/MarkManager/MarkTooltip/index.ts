import { createPopper, Instance } from '@popperjs/core';
import { Quote, COLORS, Colors } from 'model/entity';
import renderTooltip from './template.hbs';
import { getAncestor } from '../../utils';
import './style.scss';
import Comment from './Comment';
import ColorPicker from './ColorPicker';
import type MarkManager from '../index';

const TOOLTIP_CLASS_NAME = 'web-clipper-mark-manager-tooltip';
const BUTTON_CLASS_NAME = 'web-clipper-mark-manager-main-button';
const BUTTON_HOVER_CLASS_NAME = `${BUTTON_CLASS_NAME}-hover`;
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
  private readonly markManager: MarkManager;

  private submenus?: {
    comment: Comment;
    color: ColorPicker;
  };

  private readonly options: Options;
  constructor(options: Options, markManager: MarkManager) {
    this.markManager = markManager;
    this.options = options;
    this.rootEl = document.createElement('div');
    this.rootEl.classList.add(TOOLTIP_CLASS_NAME);
    this.rootEl.addEventListener('click', this.handleClick);

    this.mount();
  }

  private mount() {
    const { quote, relatedEls } = this.options;

    this.baseEl = this.findBaseEl();
    this.rootEl.innerHTML = renderTooltip({
      colors: COLORS.filter((c) => c !== quote.color),
      comment: quote.comment,
      isJoplin: Boolean(quote.note),
    });

    this.submenus = {
      comment: new Comment(
        this.rootEl.querySelector(`.${COMMENT_CLASS_NAME}`)!,
        this.handleComment,
      ),
      color: new ColorPicker(
        this.rootEl.querySelector(`.${COLORS_CLASS_NAME}`)!,
        this.handleColorPicked,
      ),
    };

    relatedEls.forEach((el) => el.classList.add(MARK_HOVER_CLASS_NAME));
    document.body.appendChild(this.rootEl);
    this.popper = createPopper(this.baseEl, this.rootEl, { placement: 'top' });

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

  private unmount(forced = false) {
    if (!this.popper || !this.submenus) {
      throw new Error('unmount failed');
    }

    if (!forced && this.submenus.comment.isDisplayed) {
      return;
    }

    this.options.onBeforeUnmount();

    for (const submenu of Object.values(this.submenus)) {
      submenu.destroy();
    }

    this.popper.destroy();
    this.popper = undefined;
    this.rootEl.remove();
    this.submenus = undefined;
    this.options.relatedEls.forEach((el) =>
      el.classList.remove(MARK_HOVER_CLASS_NAME),
    );
    document.removeEventListener('mouseout', this.handleMouseout);
    this.options.onUnmounted();
  }

  private handleColorPicked = async (color: Colors) => {
    const { id, quote } = this.options;

    await this.options.onUpdate(id, {
      ...quote,
      color,
    });

    this.unmount();
  };

  private handleComment = async (comment: string) => {
    const { id, quote } = this.options;

    await this.options.onUpdate(id, {
      ...quote,
      comment,
    });

    this.unmount(true);
  };

  private handleClick = async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const mainButtonEl = target.matches(`.${BUTTON_CLASS_NAME}`)
      ? target
      : getAncestor(target, `.${BUTTON_CLASS_NAME}`, this.rootEl);

    if (!mainButtonEl) {
      return;
    }

    const { id } = this.options;

    switch (mainButtonEl.dataset.type) {
      case 'delete':
        await this.options.onDelete(id);
        return this.unmount();
      case 'jump':
        this.jump();
        return this.unmount();
      case 'color':
      case 'comment':
        return this.toggleSubmenu(mainButtonEl.dataset.type);
      default:
        break;
    }
  };

  private jump() {
    if (this.options.quote.note?.id) {
      window.open(
        `joplin://x-callback-url/openNote?id=${this.options.quote.note.id}`,
      );
    }
  }

  private toggleSubmenu(type: 'color' | 'comment') {
    if (!this.submenus) {
      throw new Error('no submenu');
    }

    const { id } = this.options;

    if (type === 'comment' && this.markManager.commentMap[id]) {
      this.markManager.commentMap[id].toggle();
      this.unmount();
      return;
    }

    const submenu = this.submenus[type];
    const buttonEl = this.rootEl.querySelector(
      `.${BUTTON_CLASS_NAME}[data-type="${type}"]`,
    )!;

    submenu.toggle();
    buttonEl.classList.toggle(BUTTON_HOVER_CLASS_NAME);

    for (const menu of Object.values(this.submenus)) {
      if (menu !== submenu) {
        menu.hide();
      }
    }

    for (const el of this.rootEl.querySelectorAll(`.${BUTTON_CLASS_NAME}`)) {
      if (el !== buttonEl) {
        el.classList.remove(BUTTON_HOVER_CLASS_NAME);
      }
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
