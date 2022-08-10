import { unified, PluggableList, Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkHtml from 'remark-html';
import type {
  Blockquote,
  BlockContent,
  DefinitionContent,
  Paragraph,
} from 'mdast';
import { visit, EXIT } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import parseAttr from 'md-attr-parser';
import type { Quote, Colors } from 'model/entity';
import type { QuotesQuery } from 'model/db';
import { getUrlPath } from './QuoteService';

export const ATTR_PREFIX = 'data-web-clipper';
const COLOR_ATTR = `${ATTR_PREFIX}-color` as const;
const COMMENT_ATTR = `${ATTR_PREFIX}-comment` as const;

interface BlockQuoteMetadata {
  id: string;
  [COLOR_ATTR]: Colors;
  [COMMENT_ATTR]?: string;
  cite: string;
}

export function generateQuoteId(quote: Quote) {
  return `quote${quote.createdAt.toString(36)}`;
}

export function stringifyMetadata(quote: Quote) {
  const comment = quote.comment
    ? ` ${COMMENT_ATTR}="${escape(quote.comment)}"`
    : '';
  return `{#${generateQuoteId(quote)} cite="${
    quote.sourceUrl
  }" ${ATTR_PREFIX}-color="${quote.color}"${comment}}`;
}

function escape(text: string) {
  return text.replace(/[<>&"'\n]/gim, (i) => {
    return '&#' + i.charCodeAt(0) + ';';
  });
}

function unescape(text: string) {
  return text.replace(/&#(\d+);/gim, (_, code) =>
    String.fromCharCode(Number(code)),
  );
}

export async function imgSrcToDataUrl(imgSrc: string) {
  const res = await fetch(imgSrc, { credentials: 'include' });

  if (res.ok) {
    const arraybuffer = await res.arrayBuffer();

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', (result) => {
        resolve(result.target!.result as string);
      });
      reader.addEventListener('error', reject);
      reader.readAsDataURL(new Blob([arraybuffer]));
    });
  }

  return '';
}

export default class MarkdownService {
  private readonly renderer: Processor; // ast/md to html
  private readonly transformer: Processor; // ast/md to md
  private readonly parser = unified().use(remarkParse);
  readonly visit = visit;
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

    this.visit(root, 'blockquote', finder);

    const { range, blockquoteNode } = getResult();

    if (blockquoteNode && range) {
      const lastNode: Paragraph = {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: stringifyMetadata(quote),
          },
        ],
      };

      blockquoteNode.children[blockquoteNode.children.length - 1] = lastNode;

      return `${md.slice(0, range[0])}${
        this.transformer.stringify(blockquoteNode) as string
      }${md.slice(range[1])}`;
    }
  }

  // todo: not only blockquote
  extractQuotes(
    md: string,
    contentType: QuotesQuery['contentType'],
    urlPath?: string,
  ) {
    const root = this.parser.parse(md);
    const quotes: Quote[] = [];
    this.visit(root, 'blockquote', (node) => {
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

      if (urlPath && getUrlPath(sourceUrl) !== urlPath) {
        return;
      }

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
        comment: unescape(comment),
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

    return `${processedContents.join('\n>\n')}\n>\n> ${stringifyMetadata(
      quote,
    )}`;
  }

  removeBlockquote(quote: Quote, noteContent: string) {
    const root = this.parser.parse(noteContent);
    const { getResult, finder } = this.createBlockquoteFinder(quote);

    this.visit(root, 'blockquote', finder);
    const { range } = getResult();

    if (range) {
      return `${noteContent.slice(0, range[0])}${noteContent.slice(range[1])}`;
    }
  }

  private createBlockquoteFinder(quote: Quote) {
    let range: [number, number] | null = null;
    let targetMetadata: BlockQuoteMetadata | null = null;
    let blockquoteNode: Blockquote | null = null;
    const finder = (node: Blockquote) => {
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
        return EXIT;
      }
    };

    return {
      getResult: () => ({ range, metadata: targetMetadata, blockquoteNode }),
      finder,
    };
  }

  private static toPureText(node: unknown) {
    return toString(node, { includeImageAlt: false });
  }

  private static getTimestampFromQuoteId(id: string) {
    const timestamp = parseInt(id.slice('quote'.length), 36);

    if (!timestamp) {
      throw new Error('parse timestamp failed');
    }

    return timestamp;
  }
}
