<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';
import ClientService from 'service/ClientService';

export default defineComponent({
  setup() {
    const { quotes } = container.resolve(ClientService);

    return {
      quotes,
    };
  },
});
</script>
<template>
  <ul>
    <li v-for="quote of quotes" :key="quote.locators[0]">
      <template v-for="content of quote.contents">
        <div v-html="content"></div>
      </template>
    </li>
  </ul>
</template>
