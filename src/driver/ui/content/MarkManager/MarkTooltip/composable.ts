import { inject, onMounted, onUnmounted, ref, reactive, shallowRef } from 'vue';
import { createPopper, Instance } from '@popperjs/core';
import { token } from '../index';
import { MARK_QUOTE_ID_DATASET_KEY } from '../constants';

function findBaseEl(targetEl: HTMLElement, relatedEls: HTMLElement[]) {
  const firstEl = relatedEls[0];

  return Math.abs(
    firstEl.getBoundingClientRect().top - targetEl.getBoundingClientRect().top,
  ) > 200
    ? targetEl
    : firstEl;
}

export function usePopper(quoteId: string) {
  const { tooltipTargetMap, domMonitor } = inject(token)!;
  const targetEl = tooltipTargetMap[quoteId];
  const relatedEls = Array.from(
    document.querySelectorAll(`[${MARK_QUOTE_ID_DATASET_KEY}="${quoteId}"]`),
  ) as HTMLElement[];

  const popper = shallowRef<Instance | undefined>();
  const popperRef = ref<undefined | HTMLElement>();

  onMounted(() => {
    domMonitor.stop();
    popper.value = createPopper(
      findBaseEl(targetEl, relatedEls),
      popperRef.value!,
      {
        placement: 'top',
        onFirstUpdate: domMonitor.start,
      },
    );
  });

  onUnmounted(() => {
    domMonitor.stop();
    popper.value!.destroy();
    domMonitor.start();
  });

  return { popperRef, relatedEls, popper };
}

export function useSubmenu() {
  const submenuVisibility = reactive({
    color: false,
    comment: false,
  });

  const toggleSubmenu = (name: keyof typeof submenuVisibility) => {
    submenuVisibility[name] = !submenuVisibility[name];
  };

  return { submenuVisibility, toggleSubmenu };
}
