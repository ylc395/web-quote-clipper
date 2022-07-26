import type { Colors } from 'model/entity';

export default class ColorPicker {
  constructor(
    private readonly el: HTMLElement,
    private readonly handleColorPicked: (color: Colors) => void,
  ) {
    this.el.addEventListener('click', this.handleClick);
  }

  private handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target.dataset.webClipperColor) {
      this.handleColorPicked(target.dataset.webClipperColor as Colors);
      e.stopPropagation();
    }
  };

  private show() {
    this.el.style.display = 'flex';
  }

  toggle() {
    if (this.el.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  hide() {
    this.el.style.display = 'none';
  }

  destroy() {
    this.el.removeEventListener('click', this.handleClick);
  }
}
