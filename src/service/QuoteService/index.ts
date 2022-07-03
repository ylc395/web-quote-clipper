import { container, singleton } from 'tsyringe';
import { load as loadHtml } from 'cheerio';
import type { Transformer } from 'unified';
import { Quote, Note, Colors, databaseToken } from 'model/index';
import Markdown from 'service/QuoteService/Markdown';
import ConfigService from '../ConfigService';

@singleton()
export default class QuoteService {
  private readonly md = new Markdown({
    transformPlugins: [() => this.replaceQuoteContentImage],
  });
  private readonly db = container.resolve(databaseToken);
  private quotes: Required<Quote>[] = [];
  private configService = container.resolve(ConfigService);
  constructor() {
    // this.md.use(MarkdownItAttrs).use(MarkdownItAttribution);
    this.init();
  }

  private async init() {
    await Promise.all([this.db.ready, this.configService.ready]);
    const notes = await this.db.getNotesByTag(this.configService.tag);
    this.quotes = notes.flatMap((note) => this.extractQuotes(note));
  }

  // service knows note. so we process raw markdown note in service
  private extractQuotes(note: Required<Note>) {
    const html = this.md.renderSync(note.content);
    const $ = loadHtml(html);
    const blockquoteContainers = $('.c-blockquote');
    const quotes: Required<Quote>[] = [];

    blockquoteContainers.each((_, el) => {
      const $el = $(el);

      $el.find('img').replaceWith((i, v) => {
        return Markdown.imgElToText(v as unknown as HTMLImageElement);
      });

      const sourceUrl = $el.find('.c-cite a').attr('href');
      const startLocator = $el.data('startLocator') as string;
      const endLocator = $el.data('endLocator') as string;
      const color = $el.data('color') as Colors;
      const contents = $el
        .find('blockquote > p')
        .toArray()
        .map((el) => $(el).text().trim());
      const comment = $el
        .find('.c-quote-comment')
        .toArray()
        .map((el) => $(el).text().trim())
        .join('\n');

      if (sourceUrl && contents.length > 0 && startLocator && endLocator) {
        quotes.push({
          sourceUrl,
          contents,
          locators: [startLocator, endLocator],
          comment,
          color,
          note: { id: note.id, path: note.path },
        });
      }
    });

    return quotes;
  }

  private replaceQuoteContentImage: Transformer = async (node) => {
    const replacer = async (_node: typeof node) => {
      if (Markdown.isImageNode(_node)) {
        _node.alt = _node.url;
        _node.url = await this.db.putResource(_node.url);
      }

      if (Markdown.isParent(_node)) {
        for (const child of _node.children) {
          await replacer(child);
        }
      }
    };

    await replacer(node);
    return node;
  };

  async createQuote(quote: Quote) {
    await this.configService.ready;
    const { writeTarget, color } = this.configService;

    // if (!this.configService.writeTarget.id) {
    // todo: handle no write target
    //   throw new Error('empty write target id');
    // }

    const processedContents: string[] = [];

    for (const content of quote.contents) {
      processedContents.push((await this.md.transform(content)).trim());
    }

    const newQuote: Required<Quote> = {
      ...quote,
      contents: processedContents,
      color,
      note: writeTarget,
    };
    await this.db.postQuote(newQuote);
    this.quotes.push(newQuote);
  }

  async updateQuote(quote: Required<Quote>) {
    const comment = quote.comment.replace(/\n/g, '\n>\n');
    quote.comment = comment;
    await this.db.putQuote(quote);
  }
}
