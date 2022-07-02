import highlightRange from 'dom-highlight-range';
import type { Quote } from 'model/index';

const MARK_CLASSNAME = 'quote-collector-mark';

interface Maker {
  remove: () => void;
  quote: Quote;
}

const markers: Maker[] = [];

export function create(range: Range, quote: Quote) {
  markers.push({
    quote,
    remove: highlightRange(range, 'mark', { class: MARK_CLASSNAME }),
  });
}

export function isAvailableRange(range: Range) {
  const marks = Array.from(document.querySelectorAll(`.${MARK_CLASSNAME}`));
  return marks.every((el) => !range.intersectsNode(el));
}
