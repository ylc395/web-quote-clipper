import uniqueSelector from 'unique-selector';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { getSelection, getCommonAncestor, postMessage } from './utils';
import { CaptureEvents, Quote } from 'model/index';

function generateQuote(): Quote | undefined {
  const selection = getSelection();

  if (!selection) {
    return;
  }

  const commonAncestor = getCommonAncestor(selection.anchor, selection.focus);
  const locator = uniqueSelector(commonAncestor) as string;

  return {
    locator,
    sourceUrl: location.toString(),
    content: selection.text
      .split('\n')
      .filter((str) => str.length > 0)
      .map((str) => str.trim()),
    comment: '',
  };
}

export function createTooltip() {
  const selection = getSelection();

  if (!selection || !selection.focus.parentElement) {
    return;
  }

  let tooltip: TippyInstance;

  const handleClick = () => {
    const quote = generateQuote();
    if (quote) {
      postMessage({ event: CaptureEvents.Captured, payload: quote });
    }
    tooltip.destroy();
  };

  tooltip = tippy(selection.focus.parentElement, {
    showOnCreate: true,
    trigger: 'manual',
    allowHTML: true,
    interactive: true,
    content: '<div><button>Quote!</button></div>',
    appendTo: document.body,
    onDestroy: (instance) => {
      instance.popper.removeEventListener('click', handleClick);
    },
    onHidden: (instance) => {
      if (!instance.state.isDestroyed) {
        instance.destroy();
      }
    },
    onCreate: (instance) => {
      instance.popper.addEventListener('click', handleClick);
    },
  });
}
