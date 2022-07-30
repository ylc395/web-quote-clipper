import { inject, reactive } from 'vue';
import MarkManager, { token } from '../../service/MarkManager';
import usePopper from '../usePopper';

function findBaseEl(targetEl: HTMLElement, relatedEls: HTMLElement[]) {
  const firstEl = relatedEls[0];

  return Math.abs(
    firstEl.getBoundingClientRect().top - targetEl.getBoundingClientRect().top,
  ) > 200
    ? targetEl
    : firstEl;
}

export function useTooltipPopper(quoteId: string) {
  const { tooltipTargetMap } = inject(token)!;
  const targetEl = tooltipTargetMap[quoteId];
  const relatedEls = MarkManager.getMarkElsByQuoteId(quoteId);

  const { popper, popperRef } = usePopper(findBaseEl(targetEl, relatedEls), {
    placement: 'top',
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
