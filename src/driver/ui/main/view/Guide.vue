<script lang="ts">
import { defineComponent } from 'vue';
import { NButton } from 'naive-ui';
import { JOPLIN_PORT } from 'driver/joplin';
import QuoteService from 'driver/ui/main/service/QuoteService';
import RouterService from 'driver/ui/main/service/RouterService';
import { container } from 'tsyringe';

export default defineComponent({
  components: { NButton },
  setup() {
    const { init } = container.resolve(QuoteService);
    const { guideView } = container.resolve(RouterService);

    const retry = async () => {
      guideView.value = false;
      await init(true);
    };

    return { JOPLIN_PORT, retry };
  },
});
</script>
<template>
  <div>
    <p>This extension can't connect to Joplin.</p>
    <p>Make sure Joplin is running now, and follow these steps if necessary:</p>
    <ol>
      <li
        >Enable <strong>Web Clipper Service</strong> in Joplin setting panel,
        and make sure it runs on port {{ JOPLIN_PORT }}.
      </li>
      <li>Click <strong>Grant authorization</strong></li>
    </ol>
    <div class="guide-buttons">
      <NButton type="primary" @click="retry">Retry</NButton>
    </div>
  </div>
</template>
<style>
.guide-buttons {
  text-align: center;
}
</style>
