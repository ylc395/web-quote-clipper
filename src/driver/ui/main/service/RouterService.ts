import { singleton } from 'tsyringe';
import { reactive, watch } from 'vue';
import { useConfig } from 'driver/ui/common/service/configService';
import repository from './repository';

@singleton()
export default class RouterService {
  readonly views = reactive({
    options: false,
    guide: false,
  });
}
