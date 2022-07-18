import { container, singleton } from 'tsyringe';
import type { Quote } from 'model/entity';
import { databaseToken, QuoteDatabase } from 'model/db';
import type { FetchOptions } from 'model/client';

@singleton()
export default class QuoteService {
  private db?: QuoteDatabase;

  constructor() {
    this.initDb();
  }

  async fetchQuotes({ url, contentType, orderBy }: FetchOptions) {
    const quotes = await this.db!.getAllQuotes(contentType);

    if (orderBy === 'contentLength') {
      quotes.sort((a, b) => {
        const sum = (length: number, text: string) => length + text.length;
        const aLength = a.contents.reduce(sum, 0);
        const bLength = b.contents.reduce(sum, 0);

        return bLength - aLength;
      });
    }

    if (orderBy === 'createdAt') {
      quotes.sort((a, b) => {
        return b.createdAt - a.createdAt;
      });
    }

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
