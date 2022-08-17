<script lang="ts">
import { defineComponent, computed } from 'vue';
import { container } from 'tsyringe';
import {
  BIconTrashFill,
  BIconBullseye,
  BIconGlobe,
  BIconMinecart,
  BIconTruck,
} from 'bootstrap-icons-vue';
import {
  NButtonGroup,
  NButton,
  NEmpty,
  NPopconfirm,
  NEllipsis,
} from 'naive-ui';
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
    BIconTruck,
    NButton,
    NButtonGroup,
    NEmpty,
    NPopconfirm,
    NEllipsis,
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
            >
              <JoplinIcon />
              <NEllipsis>{{ quote.note.path.slice(1) }}</NEllipsis>
            </div>
            <a
              v-if="source === 'all' || !quote.note"
              :href="quote.sourceUrl"
              class="quote-url"
            >
              <BIconGlobe />
              <NEllipsis>{{ quote.sourceUrl }}</NEllipsis>
            </a>
          </div>
          <NButtonGroup size="tiny" class="quote-operation">
            <NButton
              :bordered="false"
              title="Scroll to this quote"
              v-if="matchedQuoteIds.includes(quote.id)"
              @click="scrollToQuote(quote)"
            >
              <template #icon><BIconBullseye /></template>
            </NButton>
            <NPopconfirm @positive-click="deleteQuote(quote)">
              <template #trigger>
                <NButton title="Delete Quote" :bordered="false">
                  <template #icon><BIconTrashFill /></template>
                </NButton>
              </template>
              Do you want to delete this quote permanently?
            </NPopconfirm>
          </NButtonGroup>
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
    <NEmpty v-else>
      <template #icon><BIconMinecart /></template>
      <template #default>
        <div class="empty-description">
          <p>Can't find any clipped content from this page.</p>
          <p v-if="isJoplin">Joplin may take seconds to update its database.</p>
        </div>
      </template>
      <template v-if="isJoplin" #extra>
        <NButton type="primary" @click="init">Refresh</NButton>
      </template>
    </NEmpty>
  </template>
  <div v-else class="loading">
    <div class="loading-icon"
      ><JoplinIcon v-if="isJoplin" /><BIconTruck v-else
    /></div>
    <p>loading...</p>
  </div>
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
    justify-content: space-between;

    &-path {
      font-size: 14px;
      max-width: 25em;
      white-space: nowrap;
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
      min-width: 1em;
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

  .no-search-result {
    font-size: 14px;

    span {
      font-style: italic;
    }
  }
}

.empty-description {
  text-align: center;

  p {
    margin: 0;

    &:last-child {
      margin-bottom: 20px;
    }
  }
}

.loading {
  text-align: center;
  padding-top: 80px;
  font-size: 18px;
  color: #737373;

  &-icon {
    font-size: 50px;
  }

  p {
    margin: 0;
  }
}
</style>
