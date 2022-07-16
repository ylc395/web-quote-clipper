import { container, singleton } from 'tsyringe';
import { requestClientToken } from 'model/client';
import type { Quote } from 'model/entity';
import { Ref, ref } from 'vue';

@singleton()
export default class ClientService {
  private readonly fetcher = container.resolve(requestClientToken);
  readonly quotes: Ref<Quote[]> = ref([]);

  constructor() {
    this.init();
  }

  private init = async () => {
    this.quotes.value = await this.fetcher.getQuotes({ contentType: 'html' });
  };
}
