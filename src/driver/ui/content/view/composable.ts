import type DomMonitor from '../service/DomMonitor';
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
import { token } from '../service/MarkManager';

export function usePopper(
  targetEl: HTMLElement,
  options: Partial<OptionsGeneric<StrictModifiers>>,
) {
  const { domMonitor } = inject(token)!;
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
  domMonitor = domMonitor || inject(token)!.domMonitor;
  onBeforeUpdate(domMonitor.stop);
  onUpdated(domMonitor.start);
}
