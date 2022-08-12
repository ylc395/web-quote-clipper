import { singleton } from 'tsyringe';
import { computed, ref, watch } from 'vue';
import debounce from 'lodash.debounce';

import type { Quote } from 'model/entity';
import * as joplinService from 'driver/ui/common/service/joplinService';
import webExtension from './extensionService';
import repository from './repository';

@singleton()
export default class QuoteService {
  private readonly allQuotes = ref<Quote[] | undefined>();
  private readonly tabUrl = ref<string | undefined>();
  readonly source = ref<'page' | 'all'>('page');
  readonly matchedQuoteIds = ref<Quote['id'][] | undefined>();
  readonly quotesCount = computed(() => this.allQuotes.value?.length || 0);
  readonly searchKeyword = ref('');

  readonly quotes = ref<Quote[] | undefined>();

  constructor() {
    this.init();
    watch(this.source, this.init);
    watch(this.searchKeyword, debounce(this.search, 200));
  }

  init = async () => {
    this.searchKeyword.value = '';
    this.quotes.value = undefined;
    this.matchedQuoteIds.value = undefined;

    this.tabUrl.value = await webExtension.getCurrentTabUrl();
    this.allQuotes.value = this.tabUrl.value
      ? await repository.fetchQuotes({
          contentType: 'html',
          url: this.source.value === 'all' ? undefined : this.tabUrl.value,
        })
      : [];
    this.quotes.value = this.allQuotes.value;
    this.matchedQuoteIds.value = await repository.getMatchedQuoteIds();
  };

  scrollToQuote = (quote: Quote) => {
    webExtension.scrollToMark(quote);
  };

  jumpToJoplin = (quote: Quote) => {
    if (!quote.note) {
      throw new Error('no note');
    }

    joplinService.openNote(quote.note.id);
  };

  deleteQuote = async (quote: Quote) => {
    if (!this.allQuotes.value) {
      throw new Error('no quotes');
    }

    await repository.deleteQuote(quote);
    this.allQuotes.value = this.allQuotes.value.filter(
      ({ id }) => id !== quote.id,
    );
  };

  updateMatched = async (matchedQuoteIds: Quote['id'][]) => {
    this.matchedQuoteIds.value = matchedQuoteIds;
  };

  private search = (keyword: string) => {
    if (!keyword) {
      this.quotes.value = this.allQuotes.value;
      return;
    }

    if (!this.allQuotes.value) {
      throw new Error('no quotes');
    }

    this.quotes.value = this.allQuotes.value.filter(
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
