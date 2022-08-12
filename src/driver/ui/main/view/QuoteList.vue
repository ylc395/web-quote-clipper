<script lang="ts">
import { defineComponent, computed } from 'vue';
import { container } from 'tsyringe';
import {
  BIconTrashFill,
  BIconBullseye,
  BIconGlobe,
  BIconMinecart,
} from 'bootstrap-icons-vue';
import 'github-markdown-css/github-markdown.css';

import { DbTypes } from 'model/db';
import type { Quote } from 'model/entity';
import { useConfig } from 'driver/ui/common/service/configService';

import JoplinIcon from '../../common/view/JoplinIcon.vue'; // rollup-plugin-typescript2 not support alias path for .vue
import QuoteService from '../service/QuoteService';

export default defineComponent({
  components: {
    JoplinIcon,
    BIconTrashFill,
    BIconBullseye,
    BIconGlobe,
    BIconMinecart,
  },
  setup() {
    const dbType = useConfig('db');

    const isJoplin = computed(() => dbType.value === DbTypes.Joplin);
    const joinContents = ({ contents }: Quote) => contents.join('');

    return {
      ...container.resolve(QuoteService),
      isJoplin,
      joinContents,
    };
  },
});
</script>
<template>
  <template v-if="quotes && matchedQuoteIds">
    <div v-if="quotesCount > 0" class="quote-list">
      <p class="quote-list-info" v-if="quotes && matchedQuoteIds"
        ><strong>{{ quotesCount }}</strong> quote{{
          quotes.length > 1 ? 's' : ''
        }}{{ source === 'page' ? ' from this page' : '' }}.
        <strong>{{ matchedQuoteIds.length }}</strong> matched.
        <template v-if="searchKeyword"
          ><strong>{{ quotes.length }}</strong> search result.</template
        >
      </p>
      <div
        v-for="quote of quotes"
        :key="quote.id"
        class="quote-item"
        :data-color="quote.color"
        :class="{ 'quote-item-unmatched': !matchedQuoteIds.includes(quote.id) }"
      >
        <div class="quote-item-info">
          <div class="quote-item-info-path">
            <div
              v-if="quote.note"
              :title="quote.note.path"
              class="quote-joplin-path"
              @click="jumpToJoplin(quote)"
              ><JoplinIcon />{{ quote.note.path.slice(1) }}</div
            >
            <a v-if="source === 'all'" :href="quote.sourceUrl" class="quote-url"
              ><BIconGlobe />{{ quote.sourceUrl }}</a
            >
          </div>
          <div class="quote-operation">
            <button
              v-if="matchedQuoteIds.includes(quote.id)"
              title="Scroll To This"
              @click="scrollToQuote(quote)"
              ><BIconBullseye
            /></button>
            <button title="Delete" @click="deleteQuote(quote)"
              ><BIconTrashFill
            /></button>
          </div>
        </div>
        <div class="markdown-body" v-html="joinContents(quote)"></div>
        <div v-if="quote.comment" class="quote-comment">
          {{ quote.comment }}
        </div>
      </div>
      <p class="no-search-result" v-if="quotes.length === 0"
        >No search result for keyword <span>{{ searchKeyword }}</span
        >.</p
      >
    </div>
    <div v-else class="empty-list">
      <div class="empty-icon"><BIconMinecart /></div>
      <h1 class="empty-title"
        >Can't find any clipped content from this page.</h1
      >
      <div class="empty-retry" v-if="isJoplin">
        <p
          >Joplin may take seconds to update its database. Click Refresh to
          retry.</p
        >
        <button @click="init">Refresh</button>
      </div>
    </div>
  </template>
  <div v-else>loading...</div>
</template>
<style lang="scss">
@use '../../common/view/constants';

.quote-list {
  list-style: none;
  padding-bottom: 10px;

  &-info {
    margin: 0 0 4px 0;
    color: #737373;
    font-size: 14px;
  }

  .quote-item {
    background-color: #fff;
    box-shadow: #c4c4c4 0 0 4px;
    padding: 10px 8px;
    margin: 6px 0 10px 0;
    border-radius: 6px;
    border-left: 3px solid transparent;

    @each $key, $value in constants.$mark-colors {
      &[data-color='#{$key}'] {
        border-left-color: $value;

        .quote-operation > button:hover {
          color: $value;
        }
      }
    }

    &-unmatched {
      opacity: 0.5;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .quote-item-info {
    color: #676767;
    display: flex;

    &-path {
      flex-grow: 1;
      font-size: 14px;
    }
  }

  .quote-joplin-path,
  .quote-url {
    cursor: pointer;
    display: flex;
    align-items: center;
    color: inherit;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    svg {
      margin-right: 4px;
    }
  }

  .quote-joplin-path svg {
    color: #2862be;
  }

  .markdown-body {
    margin-top: 6px;
  }

  .quote-comment {
    white-space: pre-wrap;
    background-color: #f6f6f6;
    padding: 10px;
    border-radius: 6px;
    margin-top: 10px;
    box-shadow: #888 0 0 2px;
  }

  .quote-operation {
    display: flex;
    align-items: flex-start;

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
    }
  }

  .no-search-result {
    font-size: 14px;

    span {
      font-style: italic;
    }
  }
}

.empty-list {
  background-color: #fff;
  border-radius: 8px;
  padding: 10px;
  text-align: center;

  .empty-icon {
    font-size: 30px;
  }

  .empty-title {
    font-weight: bold;
    font-size: 16px;
    margin: 0;
  }

  .empty-url {
    color: #676767;
    word-break: break-all;
  }

  .empty-retry button {
    background-color: #2878f7;
    color: #fff;
    border: 0;
    height: 30px;
    width: 80px;
    border-radius: 6px;
    cursor: pointer;
  }
}
</style>
