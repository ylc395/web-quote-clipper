<script lang="ts">
import { defineComponent, computed } from 'vue';
import { container } from 'tsyringe';
import { BIconTrashFill, BIconBullseye } from 'bootstrap-icons-vue';
import 'github-markdown-css/github-markdown.css';

import { DbTypes } from 'model/db';
import type { Quote } from 'model/entity';
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
    const joinContents = ({ contents }: Quote) => contents.join('');

    return {
      quotes,
      tabUrl,
      isJoplin,
      scrollToQuote,
      jumpToJoplin,
      deleteQuote,
      init,
      joinContents,
    };
  },
});
</script>
<template>
  <template v-if="quotes">
    <div v-if="quotes.length > 0" class="quote-list">
      <div v-for="quote of quotes" :key="quote.id" class="quote-item">
        <div class="quote-item-info">
          <div :title="quote.note.path" class="quote-path" v-if="quote.note">{{
            quote.note.path
          }}</div>
          <div class="quote-operation">
            <button title="Open In Joplin" @click="jumpToJoplin(quote)"
              ><JoplinIcon
            /></button>
            <button title="Scroll To This" @click="scrollToQuote(quote)"
              ><BIconBullseye
            /></button>
            <button title="Delete" @click="deleteQuote(quote)"
              ><BIconTrashFill
            /></button>
          </div>
        </div>
        <div class="markdown-body" v-html="joinContents(quote)"></div>
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
  background-color: #f2f2f2;

  .quote-item {
    background-color: white;
    box-shadow: #c4c4c4 0 0 4px;
    padding: 10px 8px;
    margin: 0 10px 10px 10px;
    border-radius: 6px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .quote-item-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    color: #676767;
  }

  .quote-path {
    font-size: 14px;
  }

  .quote-content {
    font-size: 16px;
  }

  .quote-operation {
    display: flex;

    & > button {
      color: inherit;
      display: flex;
      align-items: center;
      background-color: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      font-size: 16px;
      margin-left: 4px;

      &:hover {
        color: #2760bc;
      }
    }
  }
}
</style>
