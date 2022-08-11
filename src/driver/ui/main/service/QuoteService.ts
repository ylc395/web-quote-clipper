import { singleton } from 'tsyringe';
import { computed, ref, watch } from 'vue';
import debounce from 'lodash.debounce';

import type { Quote } from 'model/entity';
import runtime from 'driver/ui/runtime/mainRuntime';

@singleton()
export default class QuoteService {
  private readonly _quotes = ref<Quote[] | undefined>();
  readonly tabUrl = ref<string | undefined>();
  readonly source = ref<'page' | 'all'>('page');
  readonly matchedQuoteIds = ref<Quote['id'][] | undefined>();
  readonly quotesCount = computed(() => this._quotes.value?.length || 0);
  readonly searchKeyword = ref('');

  readonly quotes = ref<Quote[] | undefined>();

  constructor() {
    this.init();
    watch(this.source, this.init);
    watch(this.searchKeyword, debounce(this.search, 200));
  }

  init = async () => {
    this.quotes.value = undefined;
    this.matchedQuoteIds.value = undefined;

    this.tabUrl.value = await runtime.getCurrentTabUrl();
    this._quotes.value = this.tabUrl.value
      ? await runtime.fetchQuotes({
          contentType: 'html',
          url: this.source.value === 'all' ? undefined : this.tabUrl.value,
        })
      : [];
    this.quotes.value = this._quotes.value;
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
    if (!this._quotes.value) {
      throw new Error('no quotes');
    }

    await runtime.deleteQuote(quote);
    this._quotes.value = this._quotes.value.filter(({ id }) => id !== quote.id);
  };

  private search = (keyword: string) => {
    if (!keyword) {
      this.quotes.value = this._quotes.value;
      return;
    }

    if (!this._quotes.value) {
      throw new Error('no quotes');
    }

    this.quotes.value = this._quotes.value.filter(
      ({ sourceUrl, contents, comment, note }) => {
        return (
          (this.source.value === 'all' && sourceUrl.includes(keyword)) ||
          comment.includes(keyword) ||
          note?.path.includes(keyword) ||
          contents.some((content) => content.includes(keyword))
        );
      },
    );
  };
}
