<script lang="ts">
import { defineComponent } from 'vue';
import MarkManager from '../service/MarkManager';
import MarkTooltip from './MarkTooltip/index.vue';
import CommentTip from './CommentTip.vue';
import HighlightTooltip from './HighlightTooltip.vue';
import { useDomMonitor } from './composable';
import './style.scss';
import { container } from 'tsyringe';

export default defineComponent({
  components: { MarkTooltip, CommentTip, HighlightTooltip },
  setup() {
    const markManager = container.resolve(MarkManager);
    useDomMonitor(markManager.domMonitor);
    return { markManager };
  },
});
</script>
<template>
  <div>
    <HighlightTooltip />
    <template v-for="(quote, id) of markManager.matchedQuotesMap" :key="id">
      <MarkTooltip v-if="id in markManager.tooltipTargetMap" :id="id" />
      <CommentTip v-if="quote.comment" :id="id" />
    </template>
  </div>
</template>
