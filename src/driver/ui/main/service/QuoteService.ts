import { singleton } from 'tsyringe';
import { ref } from 'vue';
import type { Quote } from 'model/entity';
import runtime from 'driver/ui/runtime/mainRuntime';
import { MessageEvents as ContentRuntimeMessageEvents } from 'driver/ui/runtime/contentRuntime';

@singleton()
export default class QuoteService {
  readonly quotes = ref<Quote[] | undefined>();
  readonly tabUrl = ref<string | undefined>();

  constructor() {
    this.init();
  }

  init = async () => {
    this.tabUrl.value = await runtime.getCurrentTabUrl();

    this.quotes.value = this.tabUrl.value
      ? await runtime.getQuotes({
          contentType: 'html',
          url: this.tabUrl.value,
        })
      : [];
  };

  scrollToQuote = (quote: Quote) => {
    runtime.postMessageToCurrentTab({
      event: ContentRuntimeMessageEvents.Scroll,
      payload: quote,
    });
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

    await runtime.postMessageToCurrentTab({
      event: ContentRuntimeMessageEvents.DeleteQuote,
      payload: quote,
    });

    this.quotes.value = this.quotes.value.filter(
      ({ createdAt }) => createdAt !== quote.createdAt,
    );
  };
}
