import { singleton } from 'tsyringe';
import { reactive, watch } from 'vue';
import { useConfig } from 'driver/ui/common/service/configService';
import repository from './repository';

@singleton()
export default class RouterService {
  constructor() {
    this.checkDbStatus();
  }

  readonly views = reactive({
    options: false,
    guide: false,
  });

  private checkTimer?: number;
  private checkDbStatus() {
    watch(
      useConfig('db'),
      () => {
        clearInterval(this.checkTimer);
        this.checkTimer = setInterval(async () => {
          const isReady = await repository.isReady();
          this.views.guide = !isReady;

          if (isReady) {
            clearInterval(this.checkTimer);
          }
        }, 100);
      },
      { immediate: true },
    );
  }
}
