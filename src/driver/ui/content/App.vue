<script lang="ts">
import { provide, defineComponent, onBeforeUpdate, onUpdated } from 'vue';
import MarkTooltip from './MarkManager/MarkTooltip/index.vue';
import { token } from './MarkManager';
import App from './App';

const { markManager, highlightTooltip } = new App();

export default defineComponent({
  components: { MarkTooltip },
  setup() {
    provide(token, markManager);

    return { markManager };
  },
});
</script>
<template>
  <div>
    <template v-for="(_, id) of markManager.matchedQuotesMap" :key="id">
      <MarkTooltip v-if="id in markManager.tooltipTargetMap" :id="id" />
    </template>
  </div>
</template>
