export default class Comment {
  constructor(
    private readonly el: HTMLTextAreaElement,
    private readonly handleComment: (text: string) => void,
  ) {
    this.el.addEventListener('keydown', this.handleKeydown);
  }

  private show() {
    this.el.style.display = 'block';
    this.el.focus();
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
    const target = e.target as HTMLTextAreaElement;

    switch (e.code) {
      case 'Enter':
        (e.ctrlKey || e.metaKey) && this.handleComment(target.value);
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
