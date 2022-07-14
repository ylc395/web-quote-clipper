import { unified, PluggableList, Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkHtml from 'remark-html';
import type { Image, Parent, Blockquote } from 'mdast';
import { visit } from 'unist-util-visit';
import { toString as toPureText } from 'mdast-util-to-string';
import parseAttr from 'md-attr-parser';
import { Quote, Colors } from 'model/entity';

export const ATTR_PREFIX = 'data-web-clipper';

const LOCATOR_SPLITTER = '&';
const encode = (s: string) => btoa(s);
const decode = (s: string) => atob(s);
const generateLocatorString = (s: [string, string]) =>
  s.map(encode).join(LOCATOR_SPLITTER);
const parseLocatorString = (str: string) =>
  str.split(LOCATOR_SPLITTER).map(decode);

const generateQuoteId = () => `quote${Date.now().toString(36)}`;
const getTimestampFromQuoteId = (id: string) =>
  parseInt(id.slice('quote'.length), 36) || 0;

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
    return toPureText(root);
  }

  extractQuotes(md: string, contentType: 'pure' | 'html') {
    const root = this.parser.parse(md);
    const quotes: Quote[] = [];
    visit(root, (node) => {
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

      const sourceUrl = metadata['cite'];
      const quoteId = metadata['id'] || '';
      const locators = metadata[`${ATTR_PREFIX}-locators`] || '';
      const [startLocator, endLocator] = parseLocatorString(locators);
      const color = (metadata[`${ATTR_PREFIX}-color`] ||
        Colors.Yellow) as Colors;
      const comment = metadata[`${ATTR_PREFIX}-comment`];

      if (!sourceUrl || !startLocator || !endLocator) {
        return;
      }

      const timestamp = getTimestampFromQuoteId(quoteId);
      const children = node.children.slice(0, -1);
      const contents =
        contentType === 'pure' // img will be replaced by its url in alt
          ? children.map((child) => toPureText(child))
          : children.map((node) => {
              const { start, end } = node.position!;
              const rawText = md.slice(start.offset, end.offset);
              return this.renderSync(rawText.replaceAll(/^>/gm, ''));
            });

      quotes.push({
        sourceUrl,
        comment,
        color,
        locators: [startLocator, endLocator],
        contents,
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

    const locatorsStr = generateLocatorString(quote.locators);
    const quoteId = generateQuoteId();

    return `${processedContents.join('\n>\n')}\n>\n> {#${quoteId} cite="${
      quote.sourceUrl
    }" ${ATTR_PREFIX}-locators="${locatorsStr}" ${ATTR_PREFIX}-color="${
      quote.color
    }"}`;
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
}
