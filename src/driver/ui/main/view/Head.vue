<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';
import { BIconGearFill, BIconSearch } from 'bootstrap-icons-vue';
import { NInput, NButton, NButtonGroup } from 'naive-ui';
import Router from 'driver/ui/main/service/RouterService';
import QuoteService from 'driver/ui/main/service/QuoteService';

export default defineComponent({
  components: { BIconGearFill, BIconSearch, NInput, NButton, NButtonGroup },
  setup() {
    return { ...container.resolve(QuoteService), ...container.resolve(Router) };
  },
});
</script>
<template>
  <div>
    <div class="app-head">
      <h1 class="app-title">Quotes Collection</h1>
      <NButtonGroup class="app-head-button-group">
        <template v-if="!guideView">
          <NButton
            type="primary"
            :bordered="false"
            :ghost="source !== 'page'"
            :disabled="source === 'page'"
            @click="source = 'page'"
            >Page</NButton
          >
          <NButton
            type="primary"
            :bordered="false"
            :ghost="source !== 'all'"
            :disabled="source === 'all'"
            @click="source = 'all'"
            >All</NButton
          >
        </template>
        <NButton size="tiny" :bordered="false" @click="optionsView = true">
          <template #icon>
            <BIconGearFill />
          </template>
        </NButton>
      </NButtonGroup>
    </div>
    <div class="search-input" v-if="!guideView">
      <NInput
        clearable
        @input="search"
        :placeholder="`Search quotes${
          source === 'page' ? ' of this page' : ''
        }...`"
      >
        <template #prefix><BIconSearch /></template>
      </NInput>
    </div>
  </div>
</template>
<style lang="scss">
.app-head {
  padding: 10px 0;
  display: flex;
  flex-grow: 1;
  justify-content: space-between;

  .app-title {
    margin: 0 10px 0 0;
    font-size: 16px;
  }

  &-button-group {
    align-items: center;
  }
}

.search-input {
  margin-bottom: 16px;
}
</style>
