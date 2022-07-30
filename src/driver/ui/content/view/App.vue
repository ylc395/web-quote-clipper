<script lang="ts">
import { provide, defineComponent } from 'vue';

import MarkManager, { token as markManagerToken } from '../service/MarkManager';
import HighlightService, {
  token as highlightToken,
} from '../service/HighlightService';

import MarkTooltip from './MarkTooltip/index.vue';
import CommentTip from './CommentTip.vue';
import HighlightTooltip from './HighlightTooltip.vue';
import { useDomMonitor } from './composable';
import './style.scss';

export default defineComponent({
  props: {
    markManager: { type: MarkManager, required: true },
    highlightService: { type: HighlightService, required: true },
  },
  components: { MarkTooltip, CommentTip, HighlightTooltip },
  setup({ markManager, highlightService }) {
    provide(markManagerToken, markManager);
    provide(highlightToken, highlightService);
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
