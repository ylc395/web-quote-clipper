import uniqueSelector from 'unique-selector';
import { create as createMarker, isAvailableRange } from './markManage';
import type { Quote } from 'model/index';
import {
  isBlockElement,
  isElement,
  isImageElement,
  isTextNode,
  postMessage,
} from './utils';
import { MessageEvents } from '../types';
import Tooltip from './Tooltip';
import Markdown from 'service/MarkdownService';

let currentMousePosition = { x: 0, y: 0 };
document.addEventListener('mousemove', ({ x, y }) => {
  currentMousePosition = { x, y };
});

function getSelection() {
  const selection = document.getSelection();

  if (
    !selection ||
    selection.rangeCount > 1 ||
    selection.isCollapsed ||
    !selection.anchorNode ||
    !selection.focusNode
  ) {
    return;
  }

  const anchorEl = isElement(selection.anchorNode)
    ? selection.anchorNode
    : selection.anchorNode.parentElement;
  const focusEl = isElement(selection.focusNode)
    ? selection.focusNode
    : selection.focusNode.parentElement;

  if (!anchorEl || !focusEl) {
    return;
  }

  const isFocusElPreceding =
    anchorEl.compareDocumentPosition(focusEl) &
    Node.DOCUMENT_POSITION_PRECEDING;

  return {
    startEl: isFocusElPreceding ? focusEl : anchorEl,
    endEl: isFocusElPreceding ? anchorEl : focusEl,
    range: selection.getRangeAt(0),
  } as const;
}

function generateQuote(range: Range): Quote | undefined {
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
        lastText += Markdown.imgElToText(currentNode);
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

  if (!selection) {
    return;
  }

  let tooltip: Tooltip;

  const handleClick = async () => {
    const quote = generateQuote(selection.range);

    if (quote) {
      await postMessage({ event: MessageEvents.Captured, payload: quote });
      createMarker(selection.range, quote);
      window.getSelection()?.empty();
    } else {
      // todo: handle no quote
    }
    tooltip.destroy();
  };

  const tooltipDisabled = !isAvailableRange(selection.range);

  tooltip = new Tooltip({
    handleClick,
    disabled: tooltipDisabled,
    position: [currentMousePosition.x + 10, currentMousePosition.y + 10],
  });
}
