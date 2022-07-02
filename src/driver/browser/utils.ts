import BLOCK_ELEMENTS from 'block-elements';
import type { Message } from '../types';

export const postMessage = <T = void>(message: Message) => {
  return chrome.runtime.sendMessage<Message, T>(message);
};

export const isTextNode = (node: Node): node is Text =>
  node.nodeType === document.TEXT_NODE;

export const isElement = (node: Node): node is Element =>
  node.nodeType === document.ELEMENT_NODE;

export const isBlockElement = (element: Element) =>
  (BLOCK_ELEMENTS as string[]).includes(element.tagName.toLowerCase());

export const isImageElement = (element: Element): element is HTMLImageElement =>
  element.tagName.toLowerCase() === 'img';
