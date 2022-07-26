import { createPopper, Instance } from '@popperjs/core';
import debounce from 'lodash.debounce';
import type { Quote } from 'model/entity';
import render from './template.hbs';
import './style.scss';
import { MARK_CLASS_NAME, MARK_QUOTE_ID_DATASET_KEY_CAMEL } from '../constants';

export interface Option {
  relatedEls: HTMLElement[];
  quote: Quote;
  quoteId: string;
  onUpdate: (content: string) => void;
  onDestroy: () => void;
}

const BUTTON_CLASS_NAME = 'web-clipper-comment-main-button';
const ACTIVE_BUTTON_CLASS_NAME = `${BUTTON_CLASS_NAME}-active`;
const INPUT_CLASS_NAME = 'web-clipper-comment-input';
const CONTAINER_CLASS_NAME = 'web-clipper-comment-container';

export default class CommentTip {
  private readonly rootEl = document.createElement('div');
  private readonly textarea: HTMLTextAreaElement;
  private readonly inputArea: HTMLElement;
  private readonly buttons: {
    main: HTMLButtonElement;
    save: HTMLButtonElement;
    reset: HTMLButtonElement;
  };
  private popper?: Instance;

  constructor(private readonly option: Option) {
    this.rootEl.innerHTML = render({ content: this.option.quote.comment });
    this.textarea = this.rootEl.querySelector('textarea')!;
    this.inputArea = this.rootEl.querySelector(`.${INPUT_CLASS_NAME}`)!;
    this.buttons = {
      main: this.rootEl.querySelector(`.${BUTTON_CLASS_NAME}`)!,
      save: this.rootEl.querySelector('button[data-type="save"]')!,
      reset: this.rootEl.querySelector('button[data-type="reset"]')!,
    };

    this.mount();
    CommentTip.refreshZIndex();
  }

  private mount() {
    const baseEl = this.option.relatedEls[0];

    document.body.appendChild(this.rootEl);
    this.popper = createPopper(baseEl, this.rootEl, {
      placement: 'left-start',
      modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
    });

    this.rootEl.dataset.quoteId = this.option.quoteId;
    this.textarea.addEventListener('keydown', this.handleKeydown);
    this.textarea.addEventListener('input', this.updateButtons);
    this.buttons.main.addEventListener('click', this.toggle);
    this.buttons.save.addEventListener('click', this.submit);
    this.buttons.reset.addEventListener('click', this.reset);
    this.rootEl.addEventListener('mouseenter', this.expand);
    this.rootEl.addEventListener('mouseleave', this.collapse);
  }

  get isExpanded() {
    return this.inputArea.style.display === 'block';
  }

  get isContentChanged() {
    return this.textarea.value !== this.option.quote.comment;
  }

  toggle = () => {
    if (this.isExpanded) {
      this.collapse(true);
    } else {
      this.expand(true);
    }
  };

  private reset = () => {
    this.textarea.value = this.option.quote.comment;
    this.updateButtons();
  };

  private expand = (e: true | MouseEvent) => {
    const needFocus = e === true || e.type === 'click';

    this.inputArea.style.display = 'block';
    this.buttons.main.classList.add(ACTIVE_BUTTON_CLASS_NAME);
    this.updateButtons();

    if (needFocus) {
      this.textarea.focus();
    }
  };

  private collapse = (e: true | MouseEvent) => {
    const forced = e === true || e.type === 'click';

    if (!forced && document.activeElement === this.textarea) {
      return;
    }

    this.inputArea.style.display = 'none';
    this.buttons.main.classList.remove(ACTIVE_BUTTON_CLASS_NAME);
  };

  private updateButtons = () => {
    this.buttons.save.disabled = !this.isContentChanged;
    this.buttons.reset.disabled = !this.isContentChanged;
  };

  private handleKeydown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'Enter':
        return (e.ctrlKey || e.metaKey) && this.submit();
      case 'Escape':
        return this.collapse(true);
      default:
        break;
    }
  };

  private submit = async () => {
    if (!this.isContentChanged) {
      return;
    }

    this.option.onUpdate(this.textarea.value);
    this.collapse(true);
  };

  private static refreshZIndex = debounce(() => {
    const markEls = document.querySelectorAll(`.${MARK_CLASS_NAME}`);
    const idIndexes: Record<string, number> = {};
    let zIndex = 1;

    for (const el of markEls) {
      const quoteId = (el as HTMLElement).dataset[
        MARK_QUOTE_ID_DATASET_KEY_CAMEL
      ];

      if (quoteId && !idIndexes[quoteId]) {
        idIndexes[quoteId] = zIndex++;
      }
    }

    const commentTipEls = document.querySelectorAll(`.${CONTAINER_CLASS_NAME}`);

    for (const el of commentTipEls) {
      const rootEl = (el as HTMLElement).parentElement!;
      const id = rootEl.dataset.quoteId;

      if (!id || !idIndexes[id]) {
        throw new Error('no id');
      }

      rootEl.style.zIndex = `${idIndexes[id]}`;
    }
  }, 1000);

  updateQuote(quote: Quote) {
    this.option.quote = quote;
    this.textarea.value = quote.comment;
  }

  destroy() {
    this.popper!.destroy();
    this.rootEl.remove();
    this.option.onDestroy();
  }
}
