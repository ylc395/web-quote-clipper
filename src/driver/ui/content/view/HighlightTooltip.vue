<script lang="ts">
import { container } from 'tsyringe';
import { BIconBrushFill } from 'bootstrap-icons-vue';
import throttle from 'lodash.throttle';
import { defineComponent, ref, watchPostEffect, watch } from 'vue';
import { Colors, COLORS } from 'model/entity';
import { DbTypes } from 'model/db';
import { useDomMonitor, useConfig } from './composable';
import HighlightService from '../service/HighlightService';

export default defineComponent({
  components: { BIconBrushFill },
  setup() {
    const { capture, currentRange, generateQuote, generatedQuote } =
      container.resolve(HighlightService);
    const rootRef = ref<HTMLElement | undefined>();
    let rootRect: DOMRect | undefined = undefined;
    const isShowing = ref(true);
    const dbType = useConfig('db');
    const color = ref<Colors | undefined>();

    const toggleWhenScroll = throttle(() => {
      if (!rootRect || !currentRange.value) {
        throw new Error('no rootElRect');
      }

      const { height: tooltipHeight, y: tooltipY } = rootRect;
      const { height: rangeHeight, y: rangeY } =
        currentRange.value.range.getBoundingClientRect();

      isShowing.value =
        rangeY - (tooltipHeight + tooltipY) < 80 &&
        tooltipY - (rangeY + rangeHeight) < 80;
    }, 300);

    const handleColorPicked = (_color: Colors) => {
      color.value = _color;
      generateQuote(_color);
    };

    watchPostEffect(() => {
      if (rootRef.value) {
        rootRect = rootRef.value.getBoundingClientRect();
        document.addEventListener('scroll', toggleWhenScroll, true);
      } else {
        rootRect = undefined;
        document.removeEventListener('scroll', toggleWhenScroll, true);
        isShowing.value = true;
      }
    });

    watch(currentRange, () => (color.value = undefined));

    useDomMonitor();

    return {
      colors: COLORS,
      range: currentRange,
      rootRef,
      isShowing,
      dbType,
      JOPLIN: DbTypes.Joplin,
      color,
      capture,
      generatedQuote,
      handleColorPicked,
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
        v-for="_color of colors"
        :class="{ 'web-clipper-selected-color': color === _color }"
        @click="handleColorPicked(_color)"
        :disabled="!range.isAvailable"
        :data-web-clipper-color="_color"
      />
    </div>
    <ul
      class="web-clipper-tooltip-submenu"
      v-if="color"
      :style="{
        top: range.reversed ? '' : '100%',
        bottom: range.reversed ? '100%' : '',
      }"
    >
      <li @click="capture('persist')">Save To Joplin</li>
      <li @click="capture('clipboard-block')">Copy As Md Blockquote</li>
      <li
        v-if="generatedQuote && generatedQuote.quote.contents.length <= 1"
        @click="capture('clipboard-inline')"
      >Copy As Md Text</li>
    </ul>
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
  user-select: none;

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
    box-sizing: border-box;

    &:last-child {
      margin-right: 0;
    }

    &[disabled] {
      opacity: 0.7;
    }

    &.web-clipper-selected-color {
      border: 2px solid #fff;
    }
  }

  @each $key, $value in constants.$mark-colors {
    button[data-web-clipper-color='#{$key}'] {
      background-color: $value;
    }
  }

  .web-clipper-tooltip-submenu {
    @include constants.submenu;
    position: absolute;
    left: 0;

    & > li {
      @include constants.submenu-item;
    }
  }
}
</style>
