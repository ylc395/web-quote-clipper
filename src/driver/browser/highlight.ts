import type { Quote } from 'model/index';
import { isElement, isImageElement, postMessage, isTextNode } from './utils';
import { create as createMarker } from './markManage';
import { MessageEvents } from '../types';
import Markdown from 'service/MarkdownService';

function warnPopup(msg: string) {
  alert(msg);
}

function findBoundary(
  content: string,
  el: Element,
  startBoundary?: Readonly<[Node, number]>,
) {
  const treeWalker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );

  const texts: string[] = [];
  const nodes: Node[] = [];
  let currentNode = treeWalker.nextNode();
  let boundaryNode: Node | null = null;

  while (currentNode) {
    if (isElement(currentNode) && isImageElement(currentNode)) {
      texts.push(Markdown.imgElToText(currentNode));
      nodes.push(currentNode);
    }

    if (isTextNode(currentNode) && currentNode.textContent) {
      texts.push(currentNode.textContent);
      nodes.push(currentNode);
    }

    currentNode = treeWalker.nextNode();
  }

  const isReversed = Boolean(startBoundary);
  let textNodePointer = isReversed ? texts.length - 1 : 0;
  const startBoundaryNode = startBoundary?.[0];

  if (startBoundaryNode) {
    const startBoundaryNodeIndex = nodes.findIndex(
      (n) => n === startBoundaryNode,
    );

    // if startBoundaryNode and endBoundaryNode are siblings,
    // we can guess endBoundaryNode's position by startBoundary
    if (startBoundaryNodeIndex > -1) {
      let text = startBoundaryNode.textContent!.slice(startBoundary[1]);
      let i = startBoundaryNodeIndex + 1;

      while (text.length < content.length && i < nodes.length - 1) {
        text += nodes[i].textContent || '';
        i += 1;
      }

      textNodePointer = i;
    }
  }

  const unit = isReversed ? -1 : 1;
  let offset = 0;
  let contentCharPointer = isReversed ? content.length - 1 : 0;
  let contentMatchPoint: { index: number; node: Node } | null = null;

  for (
    ;
    isReversed ? textNodePointer >= 0 : textNodePointer < texts.length;
    textNodePointer += unit
  ) {
    const currentNode = nodes[textNodePointer];

    if (
      startBoundaryNode &&
      startBoundaryNode.compareDocumentPosition(currentNode) &
        Node.DOCUMENT_POSITION_PRECEDING
    ) {
      return;
    }

    const text = texts[textNodePointer];
    let textCharPointer = isReversed ? text.length - 1 : 0;

    while (
      (isReversed ? textCharPointer >= 0 : textCharPointer < text.length) &&
      (isReversed
        ? contentCharPointer >= 0
        : contentCharPointer < content.length)
    ) {
      const char = text[textCharPointer];

      if (/\s/.test(char)) {
        textCharPointer += unit;
        continue;
      }

      if (/\s/.test(content[contentCharPointer])) {
        contentCharPointer += unit;
        continue;
      }

      if (char === content[contentCharPointer]) {
        if (!contentMatchPoint) {
          contentMatchPoint = {
            index: textCharPointer,
            node: currentNode,
          };
          offset = textCharPointer;
        }

        contentCharPointer += unit;
      } else if (contentMatchPoint) {
        textCharPointer = contentMatchPoint.index + unit;
        contentCharPointer = isReversed ? content.length - 1 : 0;
        contentMatchPoint = null;
        continue;
      }

      textCharPointer += unit;
    }

    if (contentMatchPoint && !boundaryNode) {
      boundaryNode = contentMatchPoint.node;
    }

    if (
      isReversed ? contentCharPointer < 0 : contentCharPointer >= content.length
    ) {
      break;
    }
  }

  if (boundaryNode) {
    return [
      boundaryNode,
      isElement(boundaryNode) && isImageElement(boundaryNode)
        ? 0
        : isReversed
        ? offset + 1
        : offset,
    ] as const;
  }
}

export function highlightQuote(quote: Quote) {
  const { locators, contents } = quote;
  const startEl = document.querySelector(window.atob(locators[0]));
  const endEl = document.querySelector(window.atob(locators[1]));

  if (!startEl || !endEl) {
    return false;
  }

  const startBoundary = findBoundary(contents[0], startEl);
  const endBoundary =
    startBoundary &&
    findBoundary(contents[contents.length - 1], endEl, startBoundary);

  if (!startBoundary || !endBoundary) {
    return false;
  }

  const range = document.createRange();
  range.setStart(...startBoundary);
  range.setEnd(...endBoundary);
  createMarker(range, quote);

  return true;
}

export default async function highlight() {
  const quotes = await postMessage<Required<Quote>[]>({
    event: MessageEvents.Request,
    payload: location.href,
  });
  let failQuote = 0;

  for (const quote of quotes) {
    const isSuccessful = highlightQuote(quote);

    if (!isSuccessful) {
      failQuote += 1;
    }
  }

  warnPopup(`${failQuote} quotes failed to load.`);
}
