<script lang="ts">
import { BIconBrushFill } from 'bootstrap-icons-vue';
import throttle from 'lodash.throttle';
import { defineComponent, inject, ref, watchPostEffect } from 'vue';
import { COLORS } from 'model/entity';
import { token } from '../service/HighlightService';
import { useDomMonitor } from './composable';

export default defineComponent({
  components: { BIconBrushFill },
  setup() {
    const { capture, currentRange } = inject(token)!;
    const rootRef = ref<HTMLElement | undefined>();
    const rootRect = ref<DOMRect | undefined>();
    const isShowing = ref(true);

    const toggleWhenScroll = throttle(() => {
      if (!rootRect.value || !currentRange.value) {
        throw new Error('no rootElRect');
      }

      const { height: tooltipHeight, y: tooltipY } = rootRect.value;
      const { height: rangeHeight, y: rangeY } =
        currentRange.value.range.getBoundingClientRect();

      isShowing.value =
        rangeY - (tooltipHeight + tooltipY) < 80 &&
        tooltipY - (rangeY + rangeHeight) < 80;
    }, 300);

    watchPostEffect(() => {
      if (rootRef.value) {
        rootRect.value = rootRef.value.getBoundingClientRect();
        document.addEventListener('scroll', toggleWhenScroll, true);
      } else {
        rootRect.value = undefined;
        document.removeEventListener('scroll', toggleWhenScroll, true);
        isShowing.value = true;
      }
    });

    useDomMonitor();

    return {
      colors: COLORS,
      range: currentRange,
      rootRef,
      isShowing,
      capture,
    };
  },
});
</script>

<template>
  <div
    ref="rootRef"
    v-if="range"
    v-show="isShowing"
    id="web-clipper-tooltip-container"
    :style="{
      left: range.x + (range.reversed ? -10 : 10) + 'px',
      top: range.y + (range.reversed ? -10 : 10) + 'px',
      transform: range.reversed ? 'translate(-100%, -100%)' : '',
    }"
  >
    <BIconBrushFill />
    <div class="web-clipper-button-container">
      <button
        v-for="color of colors"
        @click="capture(color, 'persist')"
        :disabled="!range.isAvailable"
        :data-web-clipper-color="color"
      />
    </div>
  </div>
</template>
<style lang="scss">
@use './constants';

$item-size: 20px;
$item-margin: 4px;

#web-clipper-tooltip-container {
  position: fixed;
  display: flex;
  background-color: constants.$tooltip-color;
  padding: 6px 8px;
  border-radius: 8px;

  & > svg {
    width: $item-size;
    height: $item-size;
    color: #fff;
    margin-right: $item-margin;
  }

  .web-clipper-button-container {
    display: flex;
  }

  button[data-web-clipper-color] {
    all: initial;
    display: flex;
    width: $item-size;
    height: $item-size;
    border-radius: 50%;
    cursor: pointer;
    margin-right: $item-margin;

    &:last-child {
      margin-right: 0;
    }

    &[disabled] {
      opacity: 0.7;
    }
  }

  @each $key, $value in constants.$mark-colors {
    button[data-web-clipper-color='#{$key}'] {
      background-color: $value;
    }
  }
}
</style>
