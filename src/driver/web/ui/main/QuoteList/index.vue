<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';
import ClientService from 'service/ClientService';

export default defineComponent({
  setup() {
    const { quotes } = container.resolve(ClientService);

    return { quotes };
  },
});
</script>
<template>
  <ul>
    <li v-for="quote of quotes">
      {{ quote.contents }}
    </li>
  </ul>
</template>
