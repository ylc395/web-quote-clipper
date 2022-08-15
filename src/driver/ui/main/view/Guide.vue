<script lang="ts">
import { defineComponent } from 'vue';
import { JOPLIN_PORT } from 'driver/joplin';

export default defineComponent({
  components: {},
  setup() {
    return { JOPLIN_PORT };
  },
});
</script>
<template>
  <div>
    <p>This extension can't connect to Joplin.</p>
    <p>Make sure Joplin is running now, and follow these steps if necessary:</p>
    <ol>
      <li
        >Enable <strong>Web Clipper Service</strong> in Joplin setting panel,
        and make sure it runs on port {{ JOPLIN_PORT }}.
      </li>
      <li>Click <strong>Grant authorization</strong></li>
    </ol>
  </div>
</template>
