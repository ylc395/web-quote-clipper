import uniqueSelector from 'unique-selector';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import {
  getSelection,
  isBlockElement,
  isElement,
  isImageElement,
  isTextNode,
  postMessage,
} from './utils';
import { CaptureEvents, Quote } from 'model/index';

function generateQuote(): Quote | undefined {
  const selection = getSelection();

  if (!selection) {
    return;
  }

  const { range } = selection;
  const { startContainer, endContainer } = range;
  const fragment = range.cloneContents();

  if (
    (!isElement(startContainer) && !isTextNode(startContainer)) ||
    (!isElement(endContainer) && !isTextNode(endContainer))
  ) {
    return;
  }

  const startLocator: string = uniqueSelector(
    isElement(startContainer) ? startContainer : startContainer.parentElement,
  );
  const endLocator: string = uniqueSelector(
    isElement(endContainer) ? endContainer : endContainer.parentElement,
  );

  const treeWalker = document.createTreeWalker(fragment);
  const contents: string[] = [];
  let lastText = '';

  while (treeWalker.nextNode()) {
    const { currentNode } = treeWalker;

    if (isElement(currentNode)) {
      if (isBlockElement(currentNode) && lastText) {
        contents.push(lastText.trim());
        lastText = '';
      }

      if (isImageElement(currentNode)) {
        lastText += `![${currentNode.alt}](${currentNode.src} ${currentNode.title})`;
      }
    }

    if (isTextNode(currentNode) && currentNode.textContent) {
      lastText += currentNode.textContent;
    }
  }

  if (lastText) {
    contents.push(lastText.trim());
  }

  return {
    locators: [window.btoa(startLocator), window.btoa(endLocator)],
    sourceUrl: location.href,
    contents,
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
    } else {
      // todo: handle no quote
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
