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
  <ul>
    <li v-for="quote of quotes" :key="quote.createdAt">
      <div v-if="quote.note">{{ quote.note.path }}</div>
      <template v-for="content of quote.contents">
        <div v-html="content"></div>
      </template>
    </li>
  </ul>
</template>
