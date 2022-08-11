import { container, singleton } from 'tsyringe';
import browser from 'webextension-polyfill';
import EventEmitter from 'eventemitter3';
import { QuoteDatabase, Storage, StorageEvents, QuotesQuery } from 'model/db';
import type { Quote } from 'model/entity';
import MarkdownService from 'service/MarkdownService';
import { getUrlPath, generateQuoteId } from 'service/QuoteService';

const STORAGE_AREA = 'local';

@singleton()
export class BrowserStorage
  extends EventEmitter<StorageEvents>
  implements Storage
{
  constructor() {
    super();
    browser.storage.onChanged.addListener((changes, areaname) => {
      if (areaname === STORAGE_AREA) {
        this.emit(StorageEvents.Changed, changes);
      }
    });
  }

  set(key: string, value: string) {
    return browser.storage[STORAGE_AREA].set({ [key]: value });
  }

  get(key: string) {
    return browser.storage[STORAGE_AREA].get([key]).then((v) => v[key]);
  }
}

const QUOTES_KEY = 'quotes';

export class BrowserQuoteDatabase implements QuoteDatabase {
  private readonly storage = container.resolve(BrowserStorage);
  private readonly md = new MarkdownService();

  async getAllQuotes({ contentType, url }: QuotesQuery) {
    const quotesText = await this.storage.get(QUOTES_KEY);
    let quotes: Quote[];

    try {
      quotes = JSON.parse(quotesText);
    } catch {
      quotes = [];
    }

    if (url) {
      quotes = quotes.filter(({ sourceUrl }) => url === getUrlPath(sourceUrl));
    }

    return contentType === 'md'
      ? quotes
      : quotes.map((quote) => ({
          ...quote,
          contents: quote.contents.map((md) =>
            contentType === 'html'
              ? this.md.renderSync(md)
              : this.md.getPureText(md),
          ),
        }));
  }

  async postQuote(quote: Quote) {
    const quotes = await this.getAllQuotes({ contentType: 'md' });
    quotes.push(quote);

    await this.storage.set(QUOTES_KEY, JSON.stringify(quotes));
    return quote;
  }

  async putQuote(quote: Quote) {
    const quotes = await this.getAllQuotes({ contentType: 'md' });
    const index = quotes.findIndex(
      (_quote) => quote.id === generateQuoteId(_quote),
    );
    quotes[index] = quote;
    await this.storage.set(QUOTES_KEY, JSON.stringify(quotes));

    return quote;
  }

  async deleteQuote(quote: Quote) {
    const quotes = await this.getAllQuotes({ contentType: 'md' });
    const index = quotes.findIndex(
      (_quote) => quote.id === generateQuoteId(_quote),
    );

    if (index < 0) {
      throw new Error('delete failed');
    }

    quotes.splice(index, 1);
    await this.storage.set(QUOTES_KEY, JSON.stringify(quotes));
  }
}
