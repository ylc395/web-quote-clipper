<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';
import QuoteService from '../service/QuoteService';

export default defineComponent({
  setup() {
    const { quotes } = container.resolve(QuoteService);

    return {
      quotes,
    };
  },
});
</script>
<template>
  <ul class="quote-list">
    <li v-for="quote of quotes" :key="quote.createdAt" class="quote-list-item">
      <div class="quote-path" v-if="quote.note">{{ quote.note.path }}</div>
      <template v-for="content of quote.contents">
        <div class="quote-content" v-html="content"></div>
      </template>
    </li>
  </ul>
</template>
<style lang="scss">
.quote-list {
  list-style: none;
  padding: 0;

  &-item {
    width: 300px;
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
