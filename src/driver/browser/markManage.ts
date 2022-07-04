import highlightRange from 'dom-highlight-range';
import type { Quote } from 'model/index';

const STYLE_ID = 'marker-style';
const MARK_CLASSNAME = 'quote-collector-mark';
const CSS = ``;

interface Maker {
  remove: () => void;
  quote: Quote;
}

const markers: Maker[] = [];

export function create(range: Range, quote: Quote) {
  if (!document.getElementById(STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
  }

  markers.push({
    quote,
    remove: highlightRange(range, 'mark', { class: MARK_CLASSNAME }),
  });
}

export function isAvailableRange(range: Range) {
  const marks = Array.from(document.querySelectorAll(`.${MARK_CLASSNAME}`));
  return marks.every((el) => !range.intersectsNode(el));
}
