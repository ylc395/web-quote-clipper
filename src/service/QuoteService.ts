import { container, singleton } from 'tsyringe';
import type { Quote } from 'model/entity';
import { databaseToken } from 'model/io';
import ConfigService from './ConfigService';

@singleton()
export default class QuoteService {
  private readonly db = container.resolve(databaseToken);
  private config = container.resolve(ConfigService);
  private ready = Promise.all([this.db.ready, this.config.ready]);

  async fetchQuotes(url?: string) {
    await this.ready;
    const quotes = await this.db.getAllQuotes();

    // todo: emit a event here
    return url ? quotes.filter((q) => q.sourceUrl === url) : quotes;
  }

  async createQuote(quote: Quote) {
    await this.ready;
    const { writeTargetId } = this.config;

    if (!writeTargetId) {
      // todo: handle no write target
      throw new Error('empty write target id');
    }

    const newQuote: Required<Quote> = {
      ...quote,
      pureTextContents: [],
      note: { id: writeTargetId },
    };
    await this.db.postQuote(newQuote);
    this.fetchQuotes();
  }

  async updateQuote(quote: Required<Quote>) {
    await this.config.ready;
    const comment = quote.comment.replace(/\n/g, '\n>\n');
    quote.comment = comment;
    await this.db.putQuote(quote);
  }
}
