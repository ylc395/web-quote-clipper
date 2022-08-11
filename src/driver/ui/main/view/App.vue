<script lang="ts">
import { defineComponent } from 'vue';
import QuoteList from './QuoteList.vue';
import Head from './Head.vue';

export default defineComponent({
  components: { QuoteList, Head },
});
</script>
<template>
  <div id="app">
    <Head />
    <QuoteList />
  </div>
</template>
<style>
#app {
  min-width: 420px;
  box-sizing: border-box;
  background-color: #f2f2f2;
  padding: 0 10px;
}
</style>
