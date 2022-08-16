import ConfigService, { ConfigEvents } from 'service/ConfigService';
import { shallowRef, Ref, readonly } from 'vue';
import { container } from 'tsyringe';
import type { AppConfig } from 'model/config';

const configCache: Record<string, Ref<string | undefined>> = {};

export function useConfig(...args: Parameters<ConfigService['get']>) {
  const key = args[0];

  if (configCache[key]) {
    return configCache[key];
  }

  const configService = container.resolve(ConfigService);
  const value = shallowRef<string | undefined>();
  const update = async (patch: Partial<AppConfig>) => {
    if (patch[key]) {
      value.value = await configService.get(key);
    }
  };

  configService.on(ConfigEvents.Updated, update);
  configService.get(key).then((v) => (value.value = v));
  configCache[key] = value;

  return readonly(value);
}
