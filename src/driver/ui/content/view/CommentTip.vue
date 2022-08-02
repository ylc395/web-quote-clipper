<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { BIconChatRightTextFill } from 'bootstrap-icons-vue';
import { DbTypes } from 'model/db';
import MarkManager from '../service/MarkManager';
import { useDomMonitor, usePopper, useConfig } from './composable';
import { container } from 'tsyringe';

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  components: { BIconChatRightTextFill },
  setup({ id }) {
    const { matchedQuotesMap, updateQuote, commentMap } =
      container.resolve(MarkManager);
    const quote = computed(() => matchedQuotesMap[id]);
    const dbType = useConfig('db');
    const comment = ref(quote.value.comment);
    const isExpanded = computed(() => commentMap[id]);
    const isDisabled = computed(() => comment.value === quote.value.comment);
    const toggle = () => (commentMap[id] = !commentMap[id]);
    const reset = () => (comment.value = quote.value.comment);
    const save = async (patch: Parameters<typeof updateQuote>[1]) => {
      if (isUnpersisted) {
        return;
      }
      await updateQuote(id, patch);
      toggle();
    };

    const { popper, popperRef } = usePopper(
      MarkManager.getMarkElsByQuoteId(id)[0],
      {
        placement: 'left-start',
        modifiers: [{ name: 'offset', options: { offset: [0, 12] } }],
      },
    );

    const isUnpersisted = computed(
      () => dbType.value !== DbTypes.Browser && !quote.value.note,
    );

    useDomMonitor();

    return {
      comment,
      isExpanded,
      isDisabled,
      popper,
      popperRef,
      isUnpersisted,
      reset,
      toggle,
      save,
    };
  },
});
</script>
<template>
  <div ref="popperRef" class="web-clipper-comment-container">
    <button
      @click="toggle"
      class="web-clipper-comment-main-button"
      :class="{ 'web-clipper-comment-main-button-active': isExpanded }"
    >
      <BIconChatRightTextFill />
    </button>
    <div v-if="isExpanded" class="web-clipper-comment-input">
      <textarea
        v-model="comment"
        placeholder="Press Ctrl/Cmd+Enter to submit, Esc to exit"
        :readonly="isUnpersisted"
        @keydown.ctrl.enter="save({ comment })"
        @keydown.meta.enter="save({ comment })"
      />
      <div v-if="!isUnpersisted" class="web-clipper-comment-button-container">
        <button :disabled="isDisabled" @click="save({ comment })">Save</button>
        <button :disabled="isDisabled" @click="reset">Reset</button>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
@use './constants';

.web-clipper-comment-container {
  position: relative;
}

.web-clipper-comment-main-button {
  all: initial;
  display: flex;
  cursor: pointer;
  color: #8c959f5e;

  &-active {
    color: #8c959f;
  }
}

.web-clipper-comment-input {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-100%);

  & > textarea {
    @include constants.textarea;
  }

  .web-clipper-comment-button-container {
    position: absolute;
    right: 10px;
    bottom: 14px;

    & > button {
      all: initial;
      background: #3c6cd5;
      color: #fff;
      font-size: 14px;
      width: 50px;
      text-align: center;
      bottom: 10px;
      font-family: inherit;
      padding: 2px 0;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 6px;

      &:last-child {
        margin-right: 0;
      }

      &:disabled {
        color: rgba(255, 255, 255, 0.7);
        cursor: not-allowed;
      }
    }
  }
}
</style>
