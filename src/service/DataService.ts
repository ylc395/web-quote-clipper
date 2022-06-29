import { container, singleton } from 'tsyringe';
import MarkdownIt from 'markdown-it';
import { load as loadHtml } from 'cheerio';
import { Quote, Note, Colors, databaseToken } from 'model/index';
import ConfigService from './ConfigService';

@singleton()
export default class QuoteService {
  private readonly md = new MarkdownIt();
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

  private extractQuotes(note: Required<Note>) {
    const html = this.md.render(note.content);
    const htmlDocument = this.md.render(html);
    const $ = loadHtml(htmlDocument);
    const blockquoteContainers = $('.c-blockquote');
    const quotes: Required<Quote>[] = [];

    blockquoteContainers.each((_, el) => {
      const $el = $(el);
      const sourceUrl = $el.find('.c-cite a').attr('href');
      const content = $el
        .find('blockquote > p')
        .toArray()
        .map((el) => $(el).text());
      const locator = $el.data('locator') as string;
      const color = $el.data('color') as Colors;
      const comment = $el
        .find('.c-quote-comment')
        .toArray()
        .map((el) => $(el).text())
        .join('\n');

      if (sourceUrl && content && locator) {
        quotes.push({
          sourceUrl,
          content,
          locator,
          comment,
          color,
          note: {
            id: note.id,
            path: note.path,
          },
        });
      }
    });

    return quotes;
  }

  async createQuote(quote: Quote) {
    await this.configService.ready;
    const { writeTarget, color } = this.configService;

    if (!this.configService.writeTarget.id) {
      // todo: handle no write target
      throw new Error('empty write target id');
    }

    const newQuote: Required<Quote> = {
      ...quote,
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
