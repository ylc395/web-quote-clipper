<script lang="ts">
import { defineComponent, computed } from 'vue';
import { container } from 'tsyringe';
import { BIconTrashFill, BIconBullseye } from 'bootstrap-icons-vue';

import { DbTypes } from 'model/db';
import { useConfig } from 'driver/ui/composable';

import JoplinIcon from '../../JoplinIcon.vue'; // rollup-plugin-typescript2 not support alias path for .vue
import QuoteService from '../service/QuoteService';

export default defineComponent({
  components: { JoplinIcon, BIconTrashFill, BIconBullseye },
  setup() {
    const { quotes, tabUrl, scrollToQuote, jumpToJoplin, deleteQuote, init } =
      container.resolve(QuoteService);
    const dbType = useConfig('db');

    const isJoplin = computed(() => dbType.value === DbTypes.Joplin);

    return {
      quotes,
      tabUrl,
      isJoplin,
      scrollToQuote,
      jumpToJoplin,
      deleteQuote,
      init,
    };
  },
});
</script>
<template>
  <template v-if="quotes">
    <div v-if="quotes.length > 0" class="quote-list">
      <div
        v-for="quote of quotes"
        :key="quote.createdAt"
        class="quote-list-item"
      >
        <div>
          <div class="quote-path" v-if="quote.note">{{ quote.note.path }}</div>
          <div>
            <button @click="jumpToJoplin(quote)"><JoplinIcon /></button>
            <button @click="scrollToQuote(quote)"><BIconBullseye /></button>
            <button @click="deleteQuote(quote)"><BIconTrashFill /></button>
          </div>
        </div>
        <div
          v-for="content of quote.contents"
          class="quote-content"
          v-html="content"
        ></div>
      </div>
    </div>
    <div v-else>
      <h1>Can't find any clipped content from this page.</h1>
      <p v-if="tabUrl">{{ tabUrl }}</p>
      <template v-if="isJoplin">
        <p
          >Joplin may take seconds to update its database. Click Refresh to
          retry.</p
        >
        <button @click="init">Refresh</button>
      </template>
    </div>
  </template>
  <div v-else>loading...</div>
</template>
<style lang="scss">
.quote-list {
  list-style: none;
  padding: 0;

  &-item {
  }

  .quote-path {
    font-size: 14px;
    color: #676767;
  }

  .quote-content {
    font-size: 16px;
  }
}
</style>
