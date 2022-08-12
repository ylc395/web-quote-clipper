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
  width: 450px; /* max width is 800px for extension popup */
  box-sizing: border-box;
  background-color: #f2f2f2;
  padding: 0 10px 10px 10px;
}
</style>
