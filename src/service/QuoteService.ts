import { container, singleton } from 'tsyringe';
import type { Quote } from 'model/entity';
import { databaseToken, QuoteDatabase, QuotesQuery } from 'model/db';

export function getUrlPath(url: string) {
  const urlObj = new URL(url);
  return `${urlObj.origin}${urlObj.pathname}`;
}

export function generateQuoteId(quote: Omit<Quote, 'id'>) {
  return quote.createdAt.toString();
}

@singleton()
export default class QuoteService {
  private db?: QuoteDatabase;

  constructor() {
    debugger;
    this.initDb();
  }

  fetchQuotes = async ({ url, contentType, orderBy }: QuotesQuery) => {
    const quotes: Quote[] = (
      await this.db!.getAllQuotes({ contentType, url })
    ).map((quote) => ({ ...quote, id: generateQuoteId(quote) }));

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

    return quotes;
  };

  createQuote = async (quote: Quote) => {
    const createdQuote = await this.db!.postQuote(quote);
    createdQuote.id = generateQuoteId(createdQuote);

    return createdQuote;
  };

  private initDb() {
    this.db = container.resolve(databaseToken);
  }

  updateQuote = async (quote: Quote) => {
    const newQuote = await this.db!.putQuote(quote);
    return newQuote;
  };

  deleteQuote = async (quote: Quote) => {
    return this.db!.deleteQuote(quote);
  };

  searchNotes = async (keyword: string, isId = false) => {
    if (!this.db?.searchNotes || !this.db.getNoteById) {
      throw new Error('can not search notes');
    }

    return isId
      ? [await this.db.getNoteById(keyword)]
      : this.db.searchNotes(keyword);
  };
}
