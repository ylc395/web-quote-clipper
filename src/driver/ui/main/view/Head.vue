<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';
import {
  BIconGearFill,
  BIconSearch,
  BIconSortDown,
  BIconSortUp,
} from 'bootstrap-icons-vue';
import QuoteService from '../service/QuoteService';

export default defineComponent({
  components: { BIconGearFill, BIconSearch, BIconSortDown, BIconSortUp },
  setup() {
    const { source, searchKeyword } = container.resolve(QuoteService);

    return { source, searchKeyword };
  },
});
</script>
<template>
  <div>
    <div class="app-head">
      <h1 class="app-title">Quotes Collection</h1>
      <div class="app-head-button-group">
        <button @click="source = 'page'">Page</button>
        <button @click="source = 'all'">All</button>
      </div>
      <div class="app-head-icon-button-group">
        <button title="setting"><BIconGearFill /></button>
      </div>
    </div>
    <div>
      <div>
        <BIconSearch />
        <input
          v-model="searchKeyword"
          :placeholder="`Search quotes${
            source === 'page' ? ' on this page' : ''
          }...`"
        />
      </div>
      <div>
        <button><BIconSortDown /></button>
        <button><BIconSortUp /></button>
        <ul>
          <li>Sort by Create Time</li>
          <li>Sort by Web Page's Order</li>
        </ul>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.app-head {
  padding: 10px 0;
  display: flex;

  .app-title {
    margin: 0 10px 0 0;
    font-size: 16px;
  }

  &-button-group {
    flex-grow: 1;
  }

  &-icon-button-group button {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
}
</style>
