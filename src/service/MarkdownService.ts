import { unified, PluggableList, Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkHtml from 'remark-html';
import type { Image, Parent, Blockquote } from 'mdast';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import parseAttr from 'md-attr-parser';
import { Quote, Colors } from 'model/entity';

export const ATTR_PREFIX = 'data-web-clipper';

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

  private static getBlockquoteMeta(node: unknown) {
    if (!MarkdownService.isBlockquote(node)) {
      return;
    }

    const lastChild = node.children[node.children.length - 1];

    if (
      lastChild.type !== 'paragraph' ||
      lastChild.children.length !== 1 ||
      lastChild.children[0].type !== 'text'
    ) {
      return;
    }

    const metadata: Record<string, string> = parseAttr(
      lastChild.children[0].value,
    ).prop;

    return { metadata, contentNodes: node.children.slice(0, -1) };
  }

  extractQuotes(md: string, contentType: 'pure' | 'html') {
    const root = this.parser.parse(md);
    const quotes: Quote[] = [];
    visit(root, (node) => {
      const blockquote = MarkdownService.getBlockquoteMeta(node);

      if (!blockquote) {
        return;
      }

      const { metadata, contentNodes } = blockquote;

      const sourceUrl = metadata['cite'];
      const quoteId = metadata['id'] || '';
      const color = (metadata[`${ATTR_PREFIX}-color`] ||
        Colors.Yellow) as Colors;
      const comment = metadata[`${ATTR_PREFIX}-comment`];

      if (!sourceUrl) {
        return;
      }

      const timestamp = MarkdownService.getTimestampFromQuoteId(quoteId);
      const contents: string[] = [];
      const mdContents: string[] = [];

      for (const node of contentNodes) {
        const { start, end } = node.position!;
        const rawText = md.slice(start.offset, end.offset);

        mdContents.push(rawText);
        contents.push(
          contentType === 'pure'
            ? MarkdownService.toPureText(node)
            : this.renderSync(rawText.replaceAll(/^>/gm, '')),
        );
      }

      quotes.push({
        sourceUrl,
        comment,
        color,
        contents,
        mdContents,
        createdAt: timestamp,
      });
    });

    return quotes;
  }

  async generateBlockquote(quote: Quote) {
    const processedContents: string[] = [];

    for (const content of quote.contents) {
      const transformed = await this.transform(content);
      processedContents.push(
        `> ${transformed.trim().replaceAll('\n', '\n> ')}`,
      );
    }

    const quoteId = MarkdownService.generateQuoteId();

    return `${processedContents.join('\n>\n')}\n>\n> {#${quoteId} cite="${
      quote.sourceUrl
    }" ${ATTR_PREFIX}-color="${quote.color}"}`;
  }

  removeBlockquote(quote: Quote, noteContent: string) {
    const root = this.parser.parse(noteContent);
    let range: [number, number] | null = null;

    visit(root, (node) => {
      if (range) {
        return;
      }

      const blockquote = MarkdownService.getBlockquoteMeta(node);

      if (!blockquote) {
        return;
      }

      const { contentNodes } = blockquote;

      const isEqual = contentNodes.every((node, i) => {
        const { start, end } = node.position!;
        const rawText = noteContent.slice(start.offset, end.offset);

        return rawText === quote.mdContents[i];
      });

      if (isEqual) {
        range = [node.position!.start.offset!, node.position!.end.offset!];
      }
    });

    if (range) {
      return `${noteContent.slice(0, range[0])}${noteContent.slice(range[1])}`;
    }
  }

  private async transform(md: string) {
    return (await this.transformer.process(md)).toString();
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

  static imgElToText(el: HTMLImageElement) {
    return `![${el.alt}](${el.src}${el.title ? ` "${el.title}"` : ''})`;
  }

  private static toPureText(node: unknown) {
    return toString(node, { includeImageAlt: false });
  }

  private static generateQuoteId() {
    return `quote${Date.now().toString(36)}`;
  }

  private static getTimestampFromQuoteId(id: string) {
    return parseInt(id.slice('quote'.length), 36) || -Date.now();
  }
}
