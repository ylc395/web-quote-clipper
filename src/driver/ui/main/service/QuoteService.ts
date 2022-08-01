import { container, singleton } from 'tsyringe';
import { Ref, ref } from 'vue';
import type { Quote } from 'model/entity';
import Runtime from 'driver/ui/client-runtime/extension';

@singleton()
export default class QuoteService {
  readonly quotes: Ref<Quote[]> = ref([]);

  constructor() {
    this.init();
  }

  private init = async () => {
    this.quotes.value = await Runtime.getQuotes({
      contentType: 'html',
    });
  };
}
