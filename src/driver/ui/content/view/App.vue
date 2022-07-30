<script lang="ts">
import { provide, defineComponent } from 'vue';
import App from '../App';
import MarkTooltip from './MarkTooltip/index.vue';
import CommentTip from './CommentTip.vue';
import { token } from '../service/MarkManager';
import './style.scss';
import useDomMonitor from './useDomMonitor';

const { markManager, highlightTooltip } = new App();

export default defineComponent({
  components: { MarkTooltip, CommentTip },
  setup() {
    provide(token, markManager);
    useDomMonitor(markManager.domMonitor);
    return { markManager };
  },
});
</script>
<template>
  <div>
    <template v-for="(quote, id) of markManager.matchedQuotesMap" :key="id">
      <MarkTooltip v-if="id in markManager.tooltipTargetMap" :id="id" />
      <CommentTip v-if="quote.comment" :id="id" />
    </template>
  </div>
</template>
