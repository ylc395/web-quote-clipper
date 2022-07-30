<script lang="ts">
import { ref, defineComponent, inject, onMounted, onUnmounted } from 'vue';
import {
  BIconTrashFill,
  BIconPaletteFill,
  BIconChatRightTextFill,
} from 'bootstrap-icons-vue';
import { COLORS } from 'model/entity';
import JoplinIcon from './JoplinIcon.vue';
import { useTooltipPopper, useSubmenu } from './composable';
import { token } from '../../service/MarkManager';
import useDomMonitor from '../useDomMonitor';

export default defineComponent({
  components: {
    BIconTrashFill,
    BIconPaletteFill,
    BIconChatRightTextFill,
    JoplinIcon,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup({ id }) {
    const { matchedQuotesMap, deleteQuote, updateQuote, tooltipTargetMap } =
      inject(token)!;
    const quote = matchedQuotesMap[id];

    const jump = () => {
      if (quote.note) {
        window.open(`joplin://x-callback-url/openNote?id=${quote.note.id}`);
      }
    };

    const { popperRef, relatedEls, popper } = useTooltipPopper(id);
    const { submenuVisibility, toggleSubmenu } = useSubmenu();
    const comment = ref(quote.comment);
    const handleMouseout = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      const isStillInMark =
        popperRef.value!.contains(relatedTarget) ||
        popper.value!.state.elements.popper.contains(relatedTarget) ||
        relatedEls.some((el) => el.contains(relatedTarget));

      if (!isStillInMark) {
        delete tooltipTargetMap[id];
      }
    };

    useDomMonitor();
    onMounted(() => document.addEventListener('mouseout', handleMouseout));
    onUnmounted(() => document.removeEventListener('mouseout', handleMouseout));

    return {
      colors: COLORS,
      quote,
      submenuVisibility,
      comment,
      popperRef,
      jump,
      toggleSubmenu,
      deleteQuote,
      updateQuote,
    };
  },
});
</script>
<template>
  <div ref="popperRef" class="web-clipper-mark-manager-tooltip">
    <div class="web-clipper-mark-manager-button-container">
      <button
        v-if="quote.note"
        class="web-clipper-mark-manager-main-button"
        @click="jump"
        title="Open In Joplin"
      >
        <JoplinIcon />
      </button>
      <button
        class="web-clipper-mark-manager-main-button"
        @click="deleteQuote(id)"
        title="Delete"
      >
        <BIconTrashFill />
      </button>
      <button
        class="web-clipper-mark-manager-main-button"
        @click="toggleSubmenu('color')"
        title="Color"
      >
        <BIconPaletteFill />
      </button>
      <button
        class="web-clipper-mark-manager-main-button"
        @click="toggleSubmenu('comment')"
        title="Comment"
      >
        <BIconChatRightTextFill />
      </button>
    </div>
    <div v-if="submenuVisibility.color" class="web-clipper-mark-manager-colors">
      <button
        :data-web-clipper-color="color"
        v-for="color of colors"
        :key="color"
        @click="updateQuote(id, { color })"
      />
    </div>
    <div
      v-if="submenuVisibility.comment"
      class="web-clipper-mark-manager-comment"
    >
      <textarea
        placeholder="Press Ctrl/Cmd+Enter to submit, Esc to exit"
        v-model="comment"
        @keydown.ctrl.enter="updateQuote(id, { comment })"
        @keydown.meta.enter="updateQuote(id, { comment })"
      />
    </div>
  </div>
</template>
<style lang="scss">
@use '../constants';

.web-clipper-mark-manager-tooltip {
  display: flex;
  flex-direction: column-reverse;
  padding: 10px;

  .web-clipper-mark-manager-button-container {
    display: flex;
    background-color: constants.$tooltip-color;
    border-radius: 6px;
    padding: 0 8px;
    width: fit-content;
  }

  .web-clipper-mark-manager-main-button {
    all: initial;
    cursor: pointer;
    width: 32px;
    height: 32px;
    color: #d0d7de;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover,
    &-hover {
      color: #fff;
    }

    & > svg {
      height: 18px;
      width: 18px;
    }
  }

  .web-clipper-mark-manager-colors {
    margin-bottom: 4px;
    background-color: constants.$tooltip-color;
    border-radius: 6px;
    align-self: flex-end;
    width: fit-content;
    padding: 4px 6px;
    display: flex;

    & > button[data-web-clipper-color] {
      all: initial;
      width: 18px;
      height: 18px;
      cursor: pointer;
      border-radius: 50%;
      margin-right: 4px;

      &:last-child {
        margin-right: 0;
      }
    }

    @each $key, $value in constants.$mark-colors {
      & > button[data-web-clipper-color='#{$key}'] {
        background-color: $value;
      }
    }
  }

  .web-clipper-mark-manager-comment > textarea {
    @include constants.textarea;
  }
}
</style>
