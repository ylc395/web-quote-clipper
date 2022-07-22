import type { Colors, Quote } from 'model/entity';
import { toDataUrl } from 'driver/ui/request';
import {
  isBlockElement,
  isElement,
  isImageElement,
  isTextNode,
  isValidAnchorElement,
  getLastValidChild,
  isCodeElement,
  getLastChildDeep,
  getAncestor,
} from '../utils';

export function getSelectionRange() {
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

  return { range: selection.getRangeAt(0), reversed: collapseToStart };
}

export const getSelectionEndPosition = (
  range: Range,
  collapseToStart: boolean,
) => {
  range = range.cloneRange();

  if (isElement(range.endContainer) && range.endOffset === 0) {
    const walker = document.createTreeWalker(range.commonAncestorContainer);
    let currentNode = walker.currentNode;
    let textNode: Text | null = null;

    while (currentNode) {
      const nextNode = walker.nextNode();
      if (nextNode === range.endContainer || !nextNode) {
        break;
      }

      currentNode = nextNode;

      if (isTextNode(currentNode) && currentNode.textContent?.trim()) {
        textNode = currentNode;
      }
    }

    if (textNode) {
      range.setEndAfter(textNode);
    } else {
      range.setEndBefore(range.endContainer);
    }
    collapseToStart = false;
  }

  const tmpEl = document.createElement('span');

  range.collapse(collapseToStart);
  range.insertNode(tmpEl);

  const rect = tmpEl.getBoundingClientRect();
  const x = rect.left;
  const y = rect.top;

  tmpEl.remove();

  return { x, y } as const;
};

const pushContents = (contents: string[], content: string) => {
  const trimmed = content.trim();
  if (trimmed) {
    contents.push(trimmed);
  }
};

export async function generateQuote(
  range: Range,
  color: Colors,
): Promise<Quote | undefined> {
  // todo: too little case this function for

  let { startContainer, endContainer, endOffset } = range;

  if (
    (!isElement(startContainer) && !isTextNode(startContainer)) ||
    (!isElement(endContainer) && !isTextNode(endContainer))
  ) {
    return;
  }

  if (isElement(endContainer) && endOffset > 0) {
    endContainer = getLastChildDeep(endContainer);
  }

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
        pushContents(contents, lastText);
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

      if (isEndNode) {
        break;
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
          const isBlock = Boolean(getAncestor(currentNode, 'pre'));
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

      lastText += Boolean(getAncestor(currentNode, 'pre'))
        ? text
        : text.replaceAll(/\s+/g, ' ');
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
    pushContents(contents, lastText);
  }

  return {
    sourceUrl: location.href,
    color,
    contents,
    comment: '',
    createdAt: Date.now(),
  };
}
