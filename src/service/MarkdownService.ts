import { unified, PluggableList, Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkHtml from 'remark-html';
import type {
  Image,
  Parent,
  Blockquote,
  BlockContent,
  DefinitionContent,
  Paragraph,
} from 'mdast';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import parseAttr from 'md-attr-parser';
import type { Quote, Colors } from 'model/entity';

export const ATTR_PREFIX = 'data-web-clipper';
const COLOR_ATTR = `${ATTR_PREFIX}-color` as const;
const COMMENT_ATTR = `${ATTR_PREFIX}-comment` as const;

interface BlockQuoteMetadata {
  id: string;
  [COLOR_ATTR]: Colors;
  [COMMENT_ATTR]?: string;
  cite: string;
}

export default class MarkdownService {
  private readonly renderer: Processor;
  private readonly transformer: Processor;
  private readonly parser = unified().use(remarkParse);
  constructor(options?: {
    renderPlugins?: PluggableList;
    transformPlugins?: PluggableList;
  }) {
    this.renderer = unified()
      .use(remarkParse)
      .use(remarkHtml)
      .use(options?.renderPlugins || []);

    this.transformer = unified()
      .use(remarkParse)
      // https://github.com/remarkjs/remark/tree/main/packages/remark-stringify#unifieduseremarkstringify-options
      .use(remarkStringify, { fences: true })
      .use(options?.transformPlugins || []);
  }
  renderSync(md: string) {
    return this.renderer.processSync(md).toString();
  }

  getPureText(md: string) {
    const root = this.parser.parse(md);
    return MarkdownService.toPureText(root);
  }

  private static parseBlockquote(node: Blockquote):
    | {
        metadata: BlockQuoteMetadata;
        contentNodes: (BlockContent | DefinitionContent)[];
      }
    | undefined {
    const lastChild = node.children[node.children.length - 1];

    if (
      lastChild.type !== 'paragraph' ||
      lastChild.children.length !== 1 ||
      lastChild.children[0].type !== 'text'
    ) {
      return;
    }

    const metadata = parseAttr(lastChild.children[0].value).prop;

    if (!metadata.cite || !metadata.id || !metadata[COLOR_ATTR]) {
      return;
    }

    return { metadata, contentNodes: node.children.slice(0, -1) };
  }

  updateByQuote(md: string, quote: Quote) {
    const root = this.parser.parse(md);
    const { getResult, finder } = this.createBlockquoteFinder(quote);

    visit(root, finder);

    const { range, metadata, blockquoteNode } = getResult();

    if (blockquoteNode && range && metadata) {
      const lastNode: Paragraph = {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: MarkdownService.stringifyMetadata(quote, metadata.id),
          },
        ],
      };

      blockquoteNode.children[blockquoteNode.children.length - 1] = lastNode;

      return `${md.slice(0, range[0])}${
        this.transformer.stringify(blockquoteNode) as string
      }${md.slice(range[1])}`;
    }
  }

  extractQuotes(md: string, contentType: 'pure' | 'html') {
    const root = this.parser.parse(md);
    const quotes: Quote[] = [];
    visit(root, (node) => {
      if (!MarkdownService.isBlockquote(node)) {
        return;
      }

      const blockquote = MarkdownService.parseBlockquote(node);

      if (!blockquote) {
        return;
      }

      const { metadata, contentNodes } = blockquote;
      const {
        cite: sourceUrl,
        id: quoteId,
        [COLOR_ATTR]: color,
        [COMMENT_ATTR]: comment = '',
      } = metadata;
      const timestamp = MarkdownService.getTimestampFromQuoteId(quoteId);
      const contents = contentNodes.map((node) => {
        if (contentType === 'pure') {
          return MarkdownService.toPureText(node);
        }

        const { start, end } = node.position!;
        const rawText = md.slice(start.offset, end.offset);

        return this.renderSync(rawText.replaceAll(/^>/gm, ''));
      });

      quotes.push({
        sourceUrl,
        comment,
        color,
        contents,
        createdAt: timestamp,
      });
    });

    return quotes;
  }

  async generateBlockquote(quote: Quote) {
    const processedContents: string[] = [];

    for (const content of quote.contents) {
      const transformed = (await this.transformer.process(content)).toString();
      processedContents.push(
        `> ${transformed.trim().replaceAll('\n', '\n> ')}`,
      );
    }

    const quoteId = MarkdownService.generateQuoteId(quote);

    return `${processedContents.join(
      '\n>\n',
    )}\n>\n> ${MarkdownService.stringifyMetadata(quote, quoteId)}`;
  }

  private static stringifyMetadata(quote: Quote, id: string) {
    return `{#${id} cite="${quote.sourceUrl}" ${ATTR_PREFIX}-color="${quote.color}"}`;
  }

  removeBlockquote(quote: Quote, noteContent: string) {
    const root = this.parser.parse(noteContent);
    const { getResult, finder } = this.createBlockquoteFinder(quote);

    visit(root, finder);
    const { range } = getResult();

    if (range) {
      return `${noteContent.slice(0, range[0])}${noteContent.slice(range[1])}`;
    }
  }

  private createBlockquoteFinder(quote: Quote) {
    let range: [number, number] | null = null;
    let targetMetadata: BlockQuoteMetadata | null = null;
    let blockquoteNode: Blockquote | null = null;
    const finder: Parameters<typeof visit>[1] = (node) => {
      if (range || !MarkdownService.isBlockquote(node)) {
        return;
      }

      const blockquote = MarkdownService.parseBlockquote(node);

      if (!blockquote) {
        return;
      }

      const { metadata } = blockquote;
      const isEqual =
        MarkdownService.getTimestampFromQuoteId(metadata.id) ===
        quote.createdAt;

      if (isEqual) {
        range = [node.position!.start.offset!, node.position!.end.offset!];
        targetMetadata = metadata;
        blockquoteNode = node;
      }
    };

    return {
      getResult: () => ({ range, metadata: targetMetadata, blockquoteNode }),
      finder,
    };
  }

  private static isBlockquote(node: any): node is Blockquote {
    return node.type === 'blockquote';
  }

  static isImageNode(node: any): node is Image {
    return node.type === 'image';
  }

  static isParent(node: any): node is Parent {
    return Array.isArray(node.children);
  }

  private static toPureText(node: unknown) {
    return toString(node, { includeImageAlt: false });
  }

  static generateQuoteId(quote: Quote) {
    return `quote${quote.createdAt.toString(36)}`;
  }

  private static getTimestampFromQuoteId(id: string) {
    const timestamp = parseInt(id.slice('quote'.length), 36);

    if (!timestamp) {
      throw new Error('parse timestamp failed');
    }

    return timestamp;
  }
}
