import { container, singleton } from 'tsyringe';
import { load as loadHtml } from 'cheerio';
import { Quote, Note, Colors, databaseToken } from 'model/index';
import MarkdownService from './MarkdownService';
import ConfigService from './ConfigService';

@singleton()
export default class QuoteService {
  private readonly md = new MarkdownService({
    // todo: add render plugin
  });
  private readonly db = container.resolve(databaseToken);
  private quotes: Required<Quote>[] = [];
  private configService = container.resolve(ConfigService);

  async getAllQuotes() {
    await Promise.all([this.db.ready, this.configService.ready]);
    const notes = await this.db.getNotesByTag(this.configService.tag);

    this.quotes = notes.flatMap((note) => this.extractQuotes(note));
    return this.quotes;
  }

  // todo: move to driver
  private extractQuotes(note: Required<Note>) {
    const html = this.md.renderSync(note.content);
    const $ = loadHtml(html);
    const blockquoteContainers = $('.c-blockquote');
    const quotes: Required<Quote>[] = [];

    blockquoteContainers.each((_, el) => {
      const $el = $(el);
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

  async createQuote(quote: Quote) {
    await this.configService.ready;
    const { writeTargetId, color } = this.configService;

    if (!writeTargetId) {
      // todo: handle no write target
      throw new Error('empty write target id');
    }

    const newQuote: Required<Quote> = {
      ...quote,
      color,
      note: { id: writeTargetId },
    };
    await this.db.postQuote(newQuote);
    this.getAllQuotes();
  }

  async updateQuote(quote: Required<Quote>) {
    const comment = quote.comment.replace(/\n/g, '\n>\n');
    quote.comment = comment;
    await this.db.putQuote(quote);
  }
}
