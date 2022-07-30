import { InjectionKey, shallowRef, watchEffect } from 'vue';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import type { Colors, Quote } from 'model/entity';
import { postQuote, toDataUrl } from 'driver/ui/request';
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
  isVisible,
} from '../utils';
import type MarkManager from './MarkManager';
import { MARK_CLASS_NAME } from './constants';

const SUSPICIOUS_EMPTY_STRING_REGEX = /^\s{5,}$/;

function pushContents(contents: string[], content: string) {
  const trimmed = content.trim();
  if (trimmed) {
    contents.push(trimmed);
  }
}

export const token: InjectionKey<HighlightService> = Symbol();

export default class HighlightService {
  readonly currentRange = shallowRef<
    | {
        range: Range;
        reversed: boolean;
        isAvailable: boolean;
        x: number;
        y: number;
      }
    | undefined
  >();

  constructor(private readonly markManager: MarkManager) {
    document.addEventListener(
      'selectionchange',
      debounce(this.refreshSelectionRange, 500),
    );
    watchEffect(() => {
      if (this.currentRange.value) {
        document.addEventListener('selectionchange', this.clearRange);
      } else {
        document.removeEventListener('selectionchange', this.clearRange);
      }
    });
  }

  private clearRange = () => {
    this.currentRange.value = undefined;
  };

  capture = async (color: Colors) => {
    if (!this.currentRange.value) {
      throw new Error('no range');
    }

    const { range } = this.currentRange.value;
    const result = await this.generateQuote(range, color);

    if (!result) {
      return;
    }

    try {
      const createdQuote = await postQuote(result.quote);
      this.markManager.highlightQuote(createdQuote, result.range);
      window.getSelection()?.empty(); // tip: this will trigger `selectionchange`
    } catch (error) {
      // todo: handle error
      console.error(error);
      return;
    }
  };

  private async generateQuote(
    range: Range,
    color: Colors,
  ): Promise<{ quote: Quote; range: Range } | undefined> {
    // todo: too little case this function for

    let { startContainer, endContainer } = range;

    if (
      (!isElement(startContainer) && !isTextNode(startContainer)) ||
      (!isElement(endContainer) && !isTextNode(endContainer))
    ) {
      return;
    }

    // example: dbclick on <p><img /></p> will get a range with endOffset=1
    if (isElement(endContainer) && range.endOffset > 0) {
      endContainer = getLastChildDeep(endContainer);
    }

    const treeWalker = document.createTreeWalker(range.commonAncestorContainer);
    const contents: string[] = [];
    let lastText = '';
    let lastAnchor: { root: HTMLAnchorElement; lastChild: Node } | null = null;
    let lastCode: { lastChild: Node; isBlock: boolean } | null = null;
    let currentNode: Node | null = treeWalker.currentNode;

    // todo: handle strong,em,del...
    while (currentNode) {
      const isEndNode = currentNode === endContainer;

      if (
        range.startContainer.compareDocumentPosition(currentNode) &
        Node.DOCUMENT_POSITION_PRECEDING
      ) {
        currentNode = treeWalker.nextNode();
        continue;
      }

      if (isElement(currentNode)) {
        if (!isVisible(currentNode)) {
          currentNode = treeWalker.nextSibling();

          if (!currentNode) {
            treeWalker.parentNode();
            currentNode = treeWalker.nextSibling();
          }

          continue;
        }

        if (isBlockElement(currentNode) && lastText) {
          pushContents(contents, lastText);
          lastText = '';
        }

        if (isImageElement(currentNode)) {
          const imgEl = new Image();
          imgEl.title = currentNode.title;
          imgEl.alt = currentNode.src;
          imgEl.src = await toDataUrl(
            currentNode.currentSrc || currentNode.src,
          );
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
        if (
          range.endOffset === 0 &&
          SUSPICIOUS_EMPTY_STRING_REGEX.test(currentNode.textContent) &&
          !getAncestor(currentNode, 'pre')
        ) {
          break;
        }

        const text = currentNode.textContent.slice(
          currentNode === range.startContainer ? range.startOffset : 0,
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

      currentNode = treeWalker.nextNode();
    }

    if (lastText) {
      pushContents(contents, lastText);
    }

    let newRange = range;
    const previousNode = treeWalker.previousNode();

    if (endContainer !== currentNode && previousNode) {
      newRange = range.cloneRange();
      newRange.setEndAfter(previousNode);
    }

    return {
      quote: {
        sourceUrl: location.href,
        color,
        contents,
        comment: '',
        createdAt: Date.now(),
      },
      range: newRange,
    };
  }

  private static isAvailableRange = (range: Range) => {
    const marks = Array.from(document.querySelectorAll(`.${MARK_CLASS_NAME}`));
    return marks.every((el) => !range.intersectsNode(el));
  };

  private refreshSelectionRange = () => {
    const selection = document.getSelection();

    if (
      !selection ||
      selection.rangeCount > 1 ||
      selection.isCollapsed ||
      !selection.anchorNode ||
      !selection.focusNode
    ) {
      this.currentRange.value = undefined;
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

    const range = selection.getRangeAt(0);
    this.currentRange.value = {
      range,
      reversed: collapseToStart,
      isAvailable: HighlightService.isAvailableRange(range),
      ...this.getSelectionEndPosition(range, collapseToStart),
    };
  };

  private getSelectionEndPosition(range: Range, collapseToStart: boolean) {
    range = range.cloneRange();

    if (range.endOffset === 0) {
      const walker = document.createTreeWalker(range.commonAncestorContainer);
      let currentNode: Node | null = walker.currentNode;
      let textNode: Text | undefined | null = null;

      while (currentNode) {
        if (currentNode === range.endContainer) {
          break;
        }

        if (
          range.startContainer === currentNode ||
          range.startContainer.compareDocumentPosition(currentNode) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ) {
          if (isElement(currentNode) && !isVisible(currentNode)) {
            currentNode = walker.nextSibling();

            if (!currentNode) {
              walker.parentNode();
              currentNode = walker.nextSibling();
            }

            continue;
          }

          if (isTextNode(currentNode) && currentNode.textContent) {
            if (
              SUSPICIOUS_EMPTY_STRING_REGEX.test(currentNode.textContent) &&
              !getAncestor(currentNode, 'pre')
            ) {
              break;
            }

            if (currentNode.textContent.length > 0) {
              textNode = currentNode;
            }
          }
        }

        currentNode = walker.nextNode();
      }

      if (textNode) {
        range.setEndAfter(textNode);
      } else {
        range.setEndBefore(range.endContainer);
      }
      collapseToStart = false;
    }

    this.markManager.domMonitor.stop();

    const tmpEl = document.createElement('span');

    range.collapse(collapseToStart);
    range.insertNode(tmpEl);

    const rect = tmpEl.getBoundingClientRect();
    const x = rect.left;
    const y = rect.top;

    tmpEl.remove();

    this.markManager.domMonitor.start();
    return { x, y } as const;
  }
}