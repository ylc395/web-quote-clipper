interface Options {
  handleClick: () => void;
  disabled: boolean;
  position: [number, number];
}

const STYLE_ID = 'tooltip-style';
const ROOT_ID = 'tooltip-container';

export default class Tooltip {
  private readonly options: Options;
  private rootEl: HTMLElement | null = null;
  constructor(options: Options) {
    this.options = options;
    this.initStyle();
    this.initDom();
  }

  private initStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;

    styleEl.textContent = `#${ROOT_ID} * {all: initial;} #${ROOT_ID} {position: fixed;}`;
    document.head.appendChild(styleEl);
  }

  private initDom() {
    if (document.getElementById(ROOT_ID)) {
      throw new Error('duplicated tooltip');
    }

    document.addEventListener('click', this.handleClickOut);

    this.rootEl = document.createElement('div');
    this.rootEl.id = ROOT_ID;
    this.rootEl.addEventListener('click', this.options.handleClick);
    this.rootEl.innerHTML = `<button${
      this.options.disabled ? ' disabled' : ''
    }>Quote!</button>`;
    document.body.appendChild(this.rootEl);
    [this.rootEl.style.left, this.rootEl.style.top] = this.options.position.map(
      (n) => `${n}px`,
    );
  }

  private handleClickOut = (e: MouseEvent) => {
    if (!this.rootEl) {
      throw new Error('no root el');
    }

    if (!this.rootEl.contains(e.target as HTMLElement)) {
      this.destroy();
    }
  };

  destroy() {
    if (!this.rootEl) {
      throw new Error('no root');
    }

    document.removeEventListener('click', this.handleClickOut);
    this.rootEl.removeEventListener('click', this.options.handleClick);
    this.rootEl.remove();
    this.rootEl = null;
  }
}
