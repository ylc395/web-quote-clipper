import BLOCK_ELEMENTS from 'block-elements';
import { stringifyMetadata } from 'service/MarkdownService';
import type { Quote } from 'model/entity';

export { getUrlPath } from 'service/QuoteService';

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

export const isPreElement = (element: Element): element is HTMLPreElement =>
  element.tagName.toLowerCase() === 'pre';

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

export const getAncestor = (el: Node, selector: string, until?: Node) => {
  let parent = el.parentElement;

  if (until) {
    until = isElement(until) ? until : until.parentElement || document.body;
  } else {
    until = document.body;
  }

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

export const copyQuoteToClipboard = async (
  quote: Quote,
  type: 'clipboard-inline' | 'clipboard-block',
) => {
  if (type === 'clipboard-block') {
    await navigator.clipboard.writeText(
      `> ${quote.contents.join('\n>\n>')}\n>\n> ${stringifyMetadata(quote)}`,
    );
  }

  if (type === 'clipboard-inline') {
    if (quote.contents.length > 1) {
      throw new Error('can not copy to clipboard');
    }

    await navigator.clipboard.writeText(
      `[${quote.contents[0]}]${stringifyMetadata(quote)}`,
    );
  }
};

export const noop = () => {};
