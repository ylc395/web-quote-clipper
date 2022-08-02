import { container } from 'tsyringe';
import {
  createPopper,
  Instance,
  OptionsGeneric,
  StrictModifiers,
} from '@popperjs/core';
import {
  onUpdated,
  onBeforeUpdate,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  Ref,
} from 'vue';
import MarkManager from '../service/MarkManager';
import type DomMonitor from '../service/DomMonitor';
import ConfigService, { ConfigEvents } from 'service/ConfigService';

export function usePopper(
  targetEl: HTMLElement,
  options: Partial<OptionsGeneric<StrictModifiers>>,
) {
  const { domMonitor } = container.resolve(MarkManager);
  const popper = shallowRef<Instance | undefined>();
  const popperRef = ref<undefined | HTMLElement>();

  onMounted(() => {
    const token = domMonitor.stop(true);
    popper.value = createPopper(targetEl, popperRef.value!, {
      ...options,
      onFirstUpdate: () => domMonitor.start(token),
    });
  });

  onUnmounted(() => {
    domMonitor.stop();
    popper.value!.destroy();
    domMonitor.start();
  });

  return { popperRef, popper };
}

export function useDomMonitor(domMonitor?: DomMonitor) {
  domMonitor = domMonitor || container.resolve(MarkManager).domMonitor;
  onBeforeUpdate(domMonitor.stop);
  onUpdated(domMonitor.start);
}

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

  return value;
}
