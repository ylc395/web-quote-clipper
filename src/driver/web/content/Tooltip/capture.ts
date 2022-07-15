import type { Colors, Quote } from 'model/entity';
import { toDataUrl } from 'driver/web/fetcher';
import {
  isBlockElement,
  isElement,
  isImageElement,
  isTextNode,
  isValidAnchorElement,
  getLastValidChild,
  isCodeElement,
  isUnderPre,
  getLastChildDeep,
} from '../utils';

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

export const getSelectionEndPosition = () => {
  const selection = window.getSelection();

  if (!selection) {
    throw new Error('no selection');
  }

  const range = selection.getRangeAt(0).cloneRange();
  const tmpEl = document.createElement('span');

  const collapseToStart = (() => {
    const { focusNode, focusOffset, anchorNode, anchorOffset } = selection;

    if (focusNode === anchorNode) {
      return focusOffset < anchorOffset;
    }

    if (!anchorNode || !focusNode) {
      throw new Error('no anchorNode / focusNode');
    }

    return Boolean(
      anchorNode.compareDocumentPosition(focusNode) &
        Node.DOCUMENT_POSITION_PRECEDING,
    );
  })();

  range.collapse(collapseToStart);
  range.insertNode(tmpEl);

  const rect = tmpEl.getBoundingClientRect();
  const x = rect.left;
  const y = rect.top;
  tmpEl.remove();

  return {
    x,
    y,
    reversed: collapseToStart,
    offsetY: y + window.scrollY,
  } as const;
};

export async function generateQuote(
  range: Range,
  color: Colors,
): Promise<Quote | undefined> {
  let { startContainer, endContainer } = range;

  if (
    (!isElement(startContainer) && !isTextNode(startContainer)) ||
    (!isElement(endContainer) && !isTextNode(endContainer))
  ) {
    return;
  }

  endContainer = getLastChildDeep(endContainer);

  const treeWalker = document.createTreeWalker(range.commonAncestorContainer);
  const contents: string[] = [];
  let hasStarted = false;
  let lastText = '';
  let lastAnchor: { root: HTMLAnchorElement; lastChild: Node } | null = null;
  let lastCode: { lastChild: Node; isBlock: boolean } | null = null;

  // todo: handle strong,em,del...
  for (
    let currentNode: Node | null = treeWalker.currentNode;
    currentNode;
    currentNode = treeWalker.nextNode()
  ) {
    const isStartNode = currentNode === startContainer;
    const isEndNode = currentNode === endContainer;

    if (!hasStarted && isStartNode) {
      hasStarted = true;
    }

    if (!hasStarted) {
      continue;
    }

    if (isElement(currentNode)) {
      if (isBlockElement(currentNode) && lastText) {
        contents.push(lastText.trim());
        lastText = '';
      }

      if (isImageElement(currentNode)) {
        const imgEl = new Image();
        imgEl.title = currentNode.title;
        imgEl.alt = currentNode.src;
        imgEl.src = await toDataUrl(currentNode.currentSrc || currentNode.src);
        lastText += `![${imgEl.alt}](${imgEl.src}${
          imgEl.title ? ` "${imgEl.title}"` : ''
        })`;
      }

      if (isValidAnchorElement(currentNode)) {
        const lastChild = getLastValidChild(currentNode);

        if (lastChild) {
          lastAnchor = {
            root: currentNode,
            lastChild,
          };
          lastText += '[';
        }
      }

      if (isCodeElement(currentNode)) {
        const lastChild = getLastValidChild(currentNode);

        if (lastChild) {
          const isBlock = isUnderPre(currentNode);
          lastCode = { lastChild, isBlock };
          lastText += isBlock ? '```\n' : '`';
        }
      }

      if (lastAnchor?.lastChild === currentNode) {
        const lastChild = getLastValidChild(currentNode);

        if (lastChild) {
          lastAnchor.lastChild = lastChild;
        } else {
          lastText += `](${lastAnchor.root.href})`;
          lastAnchor = null;
        }
      }

      if (lastCode?.lastChild === currentNode) {
        const lastChild = getLastValidChild(currentNode);

        if (lastChild) {
          lastCode.lastChild = lastChild;
        } else {
          lastText += lastCode.isBlock ? '\n```' : '`';
          lastCode = null;
        }
      }
    }

    if (isTextNode(currentNode) && currentNode.textContent) {
      const text = currentNode.textContent.slice(
        isStartNode ? range.startOffset : 0,
        isEndNode ? range.endOffset : currentNode.textContent.length,
      );

      lastText += isUnderPre(currentNode) ? text : text.replaceAll(/\s+/g, ' ');
    }

    if (lastAnchor?.lastChild === currentNode) {
      lastText += `](${lastAnchor.root.href})`;
      lastAnchor = null;
    }

    if (lastCode?.lastChild === currentNode) {
      lastText += lastCode.isBlock ? '\n```' : '`';
      lastCode = null;
    }

    if (isEndNode) {
      break;
    }
  }

  if (lastText) {
    contents.push(lastText.trim());
  }

  return {
    sourceUrl: location.href,
    color,
    contents,
    comment: '',
    createdAt: Date.now(),
  };
}
