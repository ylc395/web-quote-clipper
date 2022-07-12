import { isElement, isImageElement, isTextNode } from '../utils';

export function warnPopup(msg: string) {
  // todo: popup
  alert(msg);
}

export function findBoundary(
  content: string,
  el: Element,
  startBoundary?: Readonly<[Node, number]>,
): [Node, number] | undefined {
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
      texts.push(currentNode.src);
      nodes.push(currentNode);
    }

    if (isTextNode(currentNode) && currentNode.textContent) {
      texts.push(currentNode.textContent);
      nodes.push(currentNode);
    }

    currentNode = treeWalker.nextNode();
  }

  if (texts.length < 1) {
    return [el, 0];
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

      while (text.length < content.length && i < texts.length - 1) {
        text += texts[i];
        i += 1;
      }

      textNodePointer = Math.min(i, texts.length - 1);
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
    ];
  }
}
