import ConfigService, { ConfigEvents } from 'service/ConfigService';
import { shallowRef, Ref, readonly } from 'vue';
import { container } from 'tsyringe';

const configCache: Record<string, Ref<string | undefined>> = {};

export function useConfig(...args: Parameters<ConfigService['get']>) {
  const key = args[0];

  if (configCache[key]) {
    return configCache[key];
  }

  const configService = container.resolve(ConfigService);
  const value = shallowRef<string | undefined>();
  const update = async () => {
    value.value = await configService.get(key);
  };

  configService.on(ConfigEvents.Updated, update);
  update();
  configCache[key] = value;

  return readonly(value);
}
