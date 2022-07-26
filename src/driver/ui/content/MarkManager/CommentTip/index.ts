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

const BUTTON_CLASS_NAME = 'web-clipper-comment-button';
const ACTIVE_BUTTON_CLASS_NAME = 'web-clipper-comment-button-active';
const INPUT_CLASS_NAME = 'web-clipper-comment-input';
const CONTAINER_CLASS_NAME = 'web-clipper-comment-container';

export default class CommentTip {
  private readonly rootEl = document.createElement('div');
  private readonly textarea: HTMLTextAreaElement;
  private readonly inputArea: HTMLElement;
  private readonly button: HTMLElement;
  private popper?: Instance;

  constructor(private readonly option: Option) {
    this.rootEl.innerHTML = render({ content: this.option.quote.comment });
    this.textarea = this.rootEl.querySelector('textarea')!;
    this.inputArea = this.rootEl.querySelector(`.${INPUT_CLASS_NAME}`)!;
    this.button = this.rootEl.querySelector(`.${BUTTON_CLASS_NAME}`)!;

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
    this.button.addEventListener('click', this.toggle);
  }

  toggle = () => {
    const display = this.inputArea.style.display === 'block' ? 'none' : 'block';

    this.inputArea.style.display = display;
    this.button.classList.toggle(ACTIVE_BUTTON_CLASS_NAME);

    if (display === 'block') {
      this.textarea.focus();
    }
  };

  private handleKeydown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'Enter':
        (e.ctrlKey || e.metaKey) && this.option.onUpdate(this.textarea.value);
        break;
      case 'Escape':
        this.toggle();
        break;
      default:
        break;
    }
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

  destroy() {
    this.popper!.destroy();
    this.rootEl.remove();
    this.option.onDestroy();
  }
}
