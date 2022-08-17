import { singleton } from 'tsyringe';
import { computed, ref } from 'vue';
import { useConfig } from 'driver/ui/common/service/configService';
import repository from './repository';
import { DbTypes } from 'model/db';

@singleton()
export default class RouterService {
  private _guideView = ref(false);
  readonly optionsView = ref(false);
  readonly guideView = computed({
    get: () => {
      return this._guideView.value && useConfig('db').value === DbTypes.Joplin;
    },
    set: (value) => {
      this._guideView.value = value;
    },
  });
}
