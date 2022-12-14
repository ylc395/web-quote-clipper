import { container } from 'tsyringe';
import { reactive } from 'vue';
import MarkManager from '../../service/MarkManager';
import { usePopper } from '../composable';

function findBaseEl(targetEl: HTMLElement, relatedEls: HTMLElement[]) {
  const firstEl = relatedEls[0];

  return Math.abs(
    firstEl.getBoundingClientRect().top - targetEl.getBoundingClientRect().top,
  ) > 200
    ? targetEl
    : firstEl;
}

export function useTooltipPopper(quoteId: string) {
  const { tooltipTargetMap } = container.resolve(MarkManager);
  const targetEl = tooltipTargetMap[quoteId];
  const relatedEls = MarkManager.getMarkElsByQuoteId(quoteId);

  const { popper, popperRef } = usePopper(findBaseEl(targetEl, relatedEls), {
    placement: 'top',
  });

  return { popperRef, relatedEls, popper };
}

export function useSubmenu(id: string) {
  const { matchedQuotesMap, commentMap } = container.resolve(MarkManager);
  const submenuVisibility = reactive({
    color: false,
    comment: false,
    copy: false,
  });

  const toggleSubmenu = (name: keyof typeof submenuVisibility) => {
    if (name === 'comment' && matchedQuotesMap[id].comment) {
      commentMap[id] = !commentMap[id];
    } else {
      submenuVisibility[name] = !submenuVisibility[name];
    }

    for (const key of Object.keys(submenuVisibility)) {
      if (key !== name) {
        submenuVisibility[key as keyof typeof submenuVisibility] = false;
      }
    }
  };

  return { submenuVisibility, toggleSubmenu };
}
