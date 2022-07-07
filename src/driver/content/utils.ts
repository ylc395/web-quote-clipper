import BLOCK_ELEMENTS from 'block-elements';
import { Message, MessageEvents } from '../types';

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

export const isValidAnchorElement = (
  element: Element,
): element is HTMLAnchorElement =>
  element.tagName.toLowerCase() === 'a' &&
  element.getAttribute('href') !== '#' &&
  /^https?:\/\//.test((element as HTMLAnchorElement).href);

export const isCodeElement = (element: Element) =>
  element.tagName.toLowerCase() === 'code';

export const getLastChildNode = (node: Element) => {
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];

    if (!isTextNode(child) && !isElement(child)) {
      continue;
    }

    return child;
  }

  return null;
};

export const isUnderPre = (el: Element) => {
  let parent = el.parentElement;

  while (parent) {
    if (parent.tagName.toLowerCase() === 'pre') {
      return true;
    }

    parent = parent.parentElement;
  }

  return false;
};

export const imgUrlToDataUrl = async (imgSrc: string) => {
  return postMessage<string>({
    event: MessageEvents.GetDataUrl,
    payload: imgSrc,
  });
};
