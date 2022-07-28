import BLOCK_ELEMENTS from 'block-elements';
import { BackgroundMessage, BackgroundMessageEvents } from 'driver/message';

export const isTextNode = (node: Node): node is Text =>
  node.nodeType === document.TEXT_NODE;

export const isElement = (node: Node): node is HTMLElement =>
  node.nodeType === document.ELEMENT_NODE;

export const isBlockElement = (element: Element) =>
  (BLOCK_ELEMENTS as string[]).includes(element.tagName.toLowerCase());

export const isImageElement = (element: Element): element is HTMLImageElement =>
  element.tagName.toLowerCase() === 'img';

export const isValidAnchorElement = (
  element: Element,
): element is HTMLAnchorElement =>
  element.tagName.toLowerCase() === 'a' &&
  Boolean(element.textContent?.length) &&
  element.getAttribute('href') !== '#' &&
  /^https?:\/\//.test((element as HTMLAnchorElement).href);

export const isCodeElement = (element: Element) =>
  element.tagName.toLowerCase() === 'code';

export const getLastValidChild = (node: Element) => {
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];

    if (!isTextNode(child) && !isElement(child)) {
      continue;
    }

    return child;
  }

  return null;
};

export const getAncestor = (el: Node, selector: string, until?: Element) => {
  let parent = el.parentElement;

  while (parent && parent !== until) {
    if (parent.matches(selector)) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
};

export const getLastChildDeep = (node: Node): Node => {
  if (node.lastChild) {
    return getLastChildDeep(node.lastChild);
  }

  return node;
};

export const isVisible = (node: Node) =>
  isElement(node)
    ? node === document.body || Boolean(node.offsetParent)
    : Boolean(node.parentElement?.offsetParent);

export const onUrlUpdated = (cb: (newUrl: string) => void) => {
  chrome.runtime.onMessage.addListener(
    ({ event, payload }: BackgroundMessage) =>
      event === BackgroundMessageEvents.UrlUpdated &&
      // todo: we need to check frameId here but there is no such an API
      // see https://github.com/w3c/webextensions/issues/12
      cb(payload.url),
  );
};
