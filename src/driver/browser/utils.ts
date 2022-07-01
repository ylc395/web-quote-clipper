import BLOCK_ELEMENTS from 'block-elements';
import type { Message } from '../types';

export function getSelection() {
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

  return {
    anchor: selection.anchorNode,
    focus: selection.focusNode,
    range: selection.getRangeAt(0),
  } as const;
}

export const postMessage = (message: Message) => {
  chrome.runtime.sendMessage(message);
};

export const isTextNode = (node: Node): node is Text =>
  node.nodeType === document.TEXT_NODE;

export const isElement = (node: Node): node is Element =>
  node.nodeType === document.ELEMENT_NODE;

export const isBlockElement = (element: Element) =>
  (BLOCK_ELEMENTS as string[]).includes(element.tagName.toLowerCase());

export const isImageElement = (element: Element): element is HTMLImageElement =>
  element.tagName.toLowerCase() === 'img';
