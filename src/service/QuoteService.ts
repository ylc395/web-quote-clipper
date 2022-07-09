import { container, singleton } from 'tsyringe';
import type { Quote } from 'model/entity';
import { databaseToken } from 'model/db';
import ConfigService from './ConfigService';

@singleton()
export default class QuoteService {
  private readonly db = container.resolve(databaseToken);
  private config = container.resolve(ConfigService);
  private ready = Promise.all([this.db.ready, this.config.ready]);

  async fetchQuotes({
    url,
    contentType,
  }: {
    url?: string;
    contentType: 'pure' | 'md' | 'html';
  }) {
    await this.ready;
    const quotes = await this.db.getAllQuotes(contentType);

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
      note: { id: writeTargetId },
    };
    await this.db.postQuote(newQuote);
  }

  async updateQuote(quote: Required<Quote>) {
    await this.config.ready;
    const comment = quote.comment.replace(/\n/g, '\n>\n');
    quote.comment = comment;
    await this.db.putQuote(quote);
  }
}
