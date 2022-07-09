import { unified, PluggableList, Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkHtml from 'remark-html';
import type { Image, Parent, Blockquote } from 'mdast';
import { visit } from 'unist-util-visit';
import { toString as toPureText } from 'mdast-util-to-string';
import parseAttr from 'md-attr-parser';
import type { Quote, Colors } from 'model/entity';

export const ATTR_PREFIX = 'data-web-clipper';
const LOCATOR_SPLITTER = '&';
const encode = (s: string) => btoa(s);
const decode = (s: string) => atob(s);

export const generateLocatorString = (s: [string, string]) =>
  s.map(encode).join(LOCATOR_SPLITTER);

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

  extractQuotes(md: string, contentType: 'pure' | 'md' | 'html') {
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
      const locators = metadata[`${ATTR_PREFIX}-locators`] || '';
      const [startLocator, endLocator] =
        locators.split(LOCATOR_SPLITTER).map(decode) || [];
      const color = metadata[`${ATTR_PREFIX}-color`] as Colors;
      const comment = metadata[`${ATTR_PREFIX}-comment`];

      if (!sourceUrl || !startLocator || !endLocator) {
        return;
      }

      const children = node.children.slice(0, -1);
      let contents: string[];

      if (contentType === 'pure') {
        contents = children.map((child) => toPureText(child));
      } else {
        contents = children.map((node) => {
          const { start, end } = node.position!;
          return md.slice(start.offset, end.offset);
        });

        if (contentType === 'html') {
          contents = contents.map((md) => this.renderSync(md));
        }
      }

      quotes.push({
        sourceUrl,
        comment,
        color,
        locators: [startLocator, endLocator],
        contents,
      });
    });

    return quotes;
  }

  async generateQuoteContent(quote: Required<Quote>) {
    const processedContents: string[] = [];

    for (const content of quote.contents) {
      const transformed = await this.transform(content);
      processedContents.push(
        `> ${transformed.trim().replaceAll('\n', '\n> ')}`,
      );
    }

    const locatorsStr = generateLocatorString(quote.locators);

    return `${processedContents.join('\n>\n')}\n>\n> {cite="${
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

  static imgElToText(el: HTMLImageElement, ignoreAlt = false) {
    return `![${ignoreAlt ? '' : el.alt}](${el.src}${
      el.title ? ` "${el.title}"` : ''
    })`;
  }
}
