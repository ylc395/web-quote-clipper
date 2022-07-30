import { createPopper, Instance, Options } from '@popperjs/core';
import { inject, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { token } from '../service/MarkManager';

export default function usePopper(
  targetEl: HTMLElement,
  options: Partial<Options>,
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
