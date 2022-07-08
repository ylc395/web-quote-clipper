<script lang="ts">
import { defineComponent } from 'vue';
import ClientService from 'service/ClientService';
import QuoteList from './QuoteList/index.vue';

export default defineComponent({
  components: { QuoteList },
  setup() {
    return {};
  },
});
</script>
<template>
  <QuoteList />
</template>
