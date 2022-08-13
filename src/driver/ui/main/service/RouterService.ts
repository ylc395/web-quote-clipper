import { singleton } from 'tsyringe';
import { reactive } from 'vue';

@singleton()
export default class RouterService {
  readonly views = reactive({
    options: false,
  });
}
