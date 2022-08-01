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
  inject,
} from 'vue';
import MarkManager from '../service/MarkManager';
import type DomMonitor from '../service/DomMonitor';

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
