import type { Message } from '../types';

function parents(base: Node) {
  let node = base.parentElement;
  const nodes: HTMLElement[] = [];

  for (; node; node = node.parentElement) {
    nodes.unshift(node);
  }
  return nodes;
}

export function getCommonAncestor(node1: Node, node2: Node) {
  if (node1 === node2) {
    return node1.parentElement;
  }

  const parents1 = parents(node1);
  const parents2 = parents(node2);

  for (let i = 0; i < parents1.length; i++) {
    if (parents1[i] !== parents2[i]) {
      return parents1[i - 1];
    }
  }

  return parents1[parents1.length - 1];
}

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
    text: selection.toString(),
  } as const;
}

export const postMessage = (message: Message) => {
  chrome.runtime.sendMessage(message);
};
