<script lang="ts">
import { defineComponent } from 'vue';
import QuoteList from './QuoteList.vue';

export default defineComponent({
  components: { QuoteList },
});
</script>
<template>
  <div id="app">
    <QuoteList />
  </div>
</template>
<style>
#app {
  min-width: 320px;
}
</style>
