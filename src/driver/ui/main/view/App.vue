<script lang="ts">
import { container } from 'tsyringe';
import { defineComponent } from 'vue';
import { NModal } from 'naive-ui';

import Router from 'driver/ui/main/service/RouterService';
import Head from './Head.vue';
import QuoteList from './QuoteList.vue';
import Options from './Options.vue';
import Guide from './Guide.vue';

export default defineComponent({
  components: { QuoteList, Head, Options, NModal, Guide },
  setup() {
    return { ...container.resolve(Router) };
  },
});
</script>
<template>
  <div id="app">
    <Head />
    <Guide v-if="guideView" />
    <QuoteList v-else />
    <NModal v-model:show="optionsView" class="big-modal">
      <Options />
    </NModal>
  </div>
</template>
<style>
#app {
  width: 450px; /* max width is 800px for extension popup */
  box-sizing: border-box;
  background-color: #f2f2f2;
  padding: 0 10px 10px 10px;
  min-height: 460px;
}

.big-modal {
  width: 80vw;
  border-radius: 12px;
}
</style>
