import { container, singleton } from 'tsyringe';
import { Ref, ref } from 'vue';
import type { Quote } from 'model/entity';
import runtime from 'driver/ui/runtime/mainRuntime';

@singleton()
export default class QuoteService {
  readonly quotes: Ref<Quote[]> = ref([]);

  constructor() {
    this.init();
  }

  private init = async () => {
    this.quotes.value = await runtime.getQuotes({
      contentType: 'html',
      url: await runtime.getCurrentTabUrl(),
    });
  };
}
