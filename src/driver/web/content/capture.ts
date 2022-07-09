import uniqueSelector from 'unique-selector';
import { Colors, Quote } from 'model/entity';
import { toDataUrl, postQuote } from 'driver/web/fetcher';
import { create as createMarker, isAvailableRange } from './markManage';
import {
  isBlockElement,
  isElement,
  isImageElement,
  isTextNode,
  isValidAnchorElement,
  getLastChildNode,
  isCodeElement,
  isUnderPre,
} from './utils';
import Tooltip from './Tooltip';

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

async function generateQuote(range: Range): Promise<Quote | undefined> {
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
  let lastAnchor: { root: HTMLAnchorElement; lastChild: Node } | null = null;
  let lastCode: { lastChild: Node; isBlock: boolean } | null = null;

  // todo: handle strong,em,del...
  while (treeWalker.nextNode()) {
    const { currentNode } = treeWalker;

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
        const lastChild = getLastChildNode(currentNode);

        if (lastChild) {
          lastAnchor = {
            root: currentNode,
            lastChild,
          };
          lastText += '[';
        }
      }

      if (isCodeElement(currentNode)) {
        const lastChild = getLastChildNode(currentNode);

        if (lastChild) {
          const isBlock = isUnderPre(currentNode);
          lastCode = { lastChild, isBlock };
          lastText += isBlock ? '```\n' : '`';
        }
      }

      if (lastAnchor?.lastChild === currentNode) {
        const lastChild = getLastChildNode(currentNode);

        if (lastChild) {
          lastAnchor.lastChild = lastChild;
        } else {
          lastText += `](${lastAnchor.root.href})`;
          lastAnchor = null;
        }
      }

      if (lastCode?.lastChild === currentNode) {
        const lastChild = getLastChildNode(currentNode);

        if (lastChild) {
          lastCode.lastChild = lastChild;
        } else {
          lastText += lastCode.isBlock ? '\n```' : '`';
          lastCode = null;
        }
      }
    }

    if (isTextNode(currentNode) && currentNode.textContent) {
      lastText += currentNode.textContent;
    }

    if (lastAnchor?.lastChild === currentNode) {
      lastText += `](${lastAnchor.root.href})`;
      lastAnchor = null;
    }

    if (lastCode?.lastChild === currentNode) {
      lastText += lastCode.isBlock ? '\n```' : '`';
      lastCode = null;
    }
  }

  if (lastText) {
    contents.push(lastText.trim());
  }

  return {
    locators: [startLocator, endLocator],
    sourceUrl: location.href,
    color: Colors.Yellow,
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
    const quote = await generateQuote(selection.range);

    if (quote) {
      await postQuote(quote);
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
