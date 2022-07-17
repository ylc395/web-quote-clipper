import { container, singleton } from 'tsyringe';
import type { Quote } from 'model/entity';
import { databaseToken, QuoteDatabase } from 'model/db';

@singleton()
export default class QuoteService {
  private db?: QuoteDatabase;

  constructor() {
    this.initDb();
  }

  async fetchQuotes({
    url,
    contentType,
  }: {
    url?: string;
    contentType: 'pure' | 'html';
  }) {
    const quotes = await this.db!.getAllQuotes(contentType);

    // todo: emit a event here
    return url ? quotes.filter((q) => q.sourceUrl === url) : quotes;
  }

  async createQuote(quote: Quote) {
    const createdQuote = await this.db!.postQuote(quote);
    return createdQuote;
  }

  private initDb() {
    this.db = container.resolve(databaseToken);
  }

  async updateQuote(quote: Required<Quote>) {
    const comment = quote.comment.replace(/\n/g, '\n>\n');
    quote.comment = comment;
    await this.db!.putQuote(quote);
  }

  async deleteQuote(quote: Quote) {
    return this.db!.deleteQuote(quote);
  }
}
