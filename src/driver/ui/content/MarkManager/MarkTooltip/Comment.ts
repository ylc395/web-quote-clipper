export default class Comment {
  constructor(
    private readonly el: HTMLElement,
    private readonly handleComment: (text: string) => void,
  ) {
    this.el.addEventListener('keydown', this.handleKeydown);
  }

  private get textarea() {
    return this.el.querySelector('textarea')!;
  }

  private show() {
    this.el.style.display = 'block';
    this.textarea.focus();
  }

  hide() {
    this.el.style.display = 'none';
  }

  toggle() {
    if (this.el.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  get isDisplayed() {
    return this.el.style.display === 'block';
  }

  private handleKeydown = (e: KeyboardEvent) => {
    if (e.target !== this.textarea) {
      return;
    }

    switch (e.code) {
      case 'Enter':
        (e.ctrlKey || e.metaKey) && this.handleComment(this.textarea.value);
        break;
      case 'Escape':
        this.hide();
        break;
      default:
        break;
    }
  };

  destroy() {
    this.el.removeEventListener('keydown', this.handleKeydown);
  }
}
