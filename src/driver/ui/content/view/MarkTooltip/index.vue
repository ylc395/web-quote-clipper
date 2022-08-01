<script lang="ts">
import { container } from 'tsyringe';
import { ref, defineComponent, onMounted, onUnmounted } from 'vue';
import {
  BIconTrashFill,
  BIconPaletteFill,
  BIconChatRightTextFill,
  BIconClipboard2Fill,
} from 'bootstrap-icons-vue';
import { COLORS } from 'model/entity';
import { DbTypes } from 'model/db';
import JoplinIcon from './JoplinIcon.vue';
import { useTooltipPopper, useSubmenu } from './composable';
import MarkManager from '../../service/MarkManager';
import { useDomMonitor, useConfig } from '../composable';

export default defineComponent({
  components: {
    BIconTrashFill,
    BIconPaletteFill,
    BIconChatRightTextFill,
    BIconClipboard2Fill,
    JoplinIcon,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup({ id }) {
    const {
      matchedQuotesMap,
      deleteQuote,
      updateQuote,
      tooltipTargetMap,
      toggleMarkHover,
      jumpToJoplin,
      copyAs,
    } = container.resolve(MarkManager);
    const quote = matchedQuotesMap[id];
    const handleUpdate = async (patch: Parameters<typeof updateQuote>[1]) => {
      await updateQuote(id, patch);
      delete tooltipTargetMap[id];
    };

    const { popperRef, relatedEls, popper } = useTooltipPopper(id);
    const { submenuVisibility, toggleSubmenu } = useSubmenu(id);
    const comment = ref(matchedQuotesMap[id].comment);
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

    const handleCopy = async (type: Parameters<typeof copyAs>[1]) => {
      await copyAs(id, type);
      delete tooltipTargetMap[id];
    };

    const dbType = useConfig('db');

    useDomMonitor();
    onMounted(() => {
      document.addEventListener('mouseout', handleMouseout);
      toggleMarkHover(id);
    });
    onUnmounted(() => {
      document.removeEventListener('mouseout', handleMouseout);
      toggleMarkHover(id);
    });

    return {
      colors: COLORS,
      quote,
      submenuVisibility,
      comment,
      popperRef,
      dbType,
      JOPLIN: DbTypes.Joplin,
      jumpToJoplin,
      toggleSubmenu,
      deleteQuote,
      handleUpdate,
      handleCopy,
    };
  },
});
</script>
<template>
  <div ref="popperRef" class="web-clipper-mark-manager-tooltip">
    <div class="web-clipper-mark-manager-button-container">
      <button
        v-if="quote.note && dbType === JOPLIN"
        class="web-clipper-mark-manager-main-button"
        @click="jumpToJoplin(id)"
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
        v-if="dbType === JOPLIN && !quote.note"
        class="web-clipper-mark-manager-main-button"
        @click="toggleSubmenu('copy')"
        title="Copy"
      >
        <BIconClipboard2Fill />
      </button>
      <button
        v-if="quote.note"
        class="web-clipper-mark-manager-main-button"
        @click="toggleSubmenu('color')"
        title="Color"
      >
        <BIconPaletteFill />
      </button>
      <button
        v-if="quote.note"
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
        @click="handleUpdate({ color })"
      />
    </div>
    <div
      v-if="submenuVisibility.comment"
      class="web-clipper-mark-manager-comment"
    >
      <textarea
        placeholder="Press Ctrl/Cmd+Enter to submit, Esc to exit"
        v-model="comment"
        @keydown.ctrl.enter="handleUpdate({ comment })"
        @keydown.meta.enter="handleUpdate({ comment })"
      />
    </div>
    <div v-if="submenuVisibility.copy" class="web-clipper-mark-manager-copy">
      <button @click="handleCopy('clipboard-block')">
        Copy As Md Blockquote
      </button>
      <button
        v-if="quote.contents.length <= 1"
        @click="handleCopy('clipboard-inline')"
      >
        Copy As Md Text
      </button>
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

  .web-clipper-mark-manager-colors,
  .web-clipper-mark-manager-copy {
    margin-bottom: 4px;
    background-color: constants.$tooltip-color;
    border-radius: 6px;
    align-self: flex-end;
    width: fit-content;
    padding: 4px 6px;
    display: flex;
  }

  .web-clipper-mark-manager-colors {
    & > button {
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

  .web-clipper-mark-manager-copy {
    @include constants.submenu;
    overflow: hidden;

    & > button {
      @include constants.submenu-item;
      box-sizing: border-box;
      width: 100%;
    }
  }
}
</style>
