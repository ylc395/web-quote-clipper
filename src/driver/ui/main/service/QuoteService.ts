import { singleton } from 'tsyringe';
import { ref } from 'vue';
import type { Quote } from 'model/entity';
import runtime from 'driver/ui/runtime/mainRuntime';

@singleton()
export default class QuoteService {
  readonly quotes = ref<Quote[] | undefined>();
  readonly tabUrl = ref<string | undefined>();
  readonly matchedQuoteIds = ref<Quote['id'][] | undefined>();

  constructor() {
    this.init();
  }

  init = async () => {
    this.tabUrl.value = await runtime.getCurrentTabUrl();

    this.quotes.value = this.tabUrl.value
      ? await runtime.fetchQuotes({
          contentType: 'html',
          url: this.tabUrl.value,
        })
      : [];

    this.matchedQuoteIds.value = await runtime.getMatchedQuoteIds();
  };

  scrollToQuote = (quote: Quote) => {
    runtime.scrollToMark(quote);
  };

  jumpToJoplin = (quote: Quote) => {
    if (!quote.note) {
      throw new Error('no note');
    }

    runtime.jumpToJoplin(quote.note.id);
  };

  deleteQuote = async (quote: Quote) => {
    if (!this.quotes.value) {
      throw new Error('no quotes');
    }

    await runtime.deleteQuote(quote);
    this.quotes.value = this.quotes.value.filter(({ id }) => id !== quote.id);
  };
}
