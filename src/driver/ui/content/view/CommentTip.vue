<script lang="ts">
import { computed, defineComponent, inject, ref } from 'vue';
import { BIconChatRightTextFill } from 'bootstrap-icons-vue';
import MarkManager, { token } from '../service/MarkManager';
import { useDomMonitor, usePopper } from './composable';

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  components: { BIconChatRightTextFill },
  setup({ id }) {
    const { matchedQuotesMap, updateQuote, commentMap } = inject(token)!;
    const quote = computed(() => matchedQuotesMap[id]);
    const comment = ref(quote.value.comment);
    const isExpanded = computed(() => commentMap[id]);
    const isDisabled = computed(() => comment.value === quote.value.comment);
    const toggle = () => (commentMap[id] = !commentMap[id]);
    const reset = () => (comment.value = quote.value.comment);

    const { popper, popperRef } = usePopper(
      MarkManager.getMarkElsByQuoteId(id)[0],
      {
        placement: 'left-start',
      },
    );

    useDomMonitor();

    return {
      comment,
      isExpanded,
      isDisabled,
      popper,
      popperRef,
      reset,
      toggle,
      updateQuote,
    };
  },
});
</script>
<template>
  <div ref="popperRef" class="web-clipper-comment-container">
    <button @click="toggle" class="web-clipper-comment-main-button">
      <BIconChatRightTextFill />
    </button>
    <div v-if="isExpanded" class="web-clipper-comment-input">
      <textarea
        v-model="comment"
        placeholder="Press Ctrl/Cmd+Enter to submit, Esc to exit"
      />
      <div class="web-clipper-comment-button-container">
        <button :disabled="isDisabled" @click="updateQuote(id, { comment })">
          Save
        </button>
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

      &:disabled {
        color: rgba(255, 255, 255, 0.7);
        cursor: not-allowed;
      }
    }
  }
}
</style>