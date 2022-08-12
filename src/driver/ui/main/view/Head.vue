<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';
import {
  BIconGearFill,
  BIconSearch,
  BIconSortDown,
  BIconSortUp,
} from 'bootstrap-icons-vue';
import QuoteService from '../service/QuoteService';

export default defineComponent({
  components: { BIconGearFill, BIconSearch, BIconSortDown, BIconSortUp },
  setup() {
    return { ...container.resolve(QuoteService) };
  },
});
</script>
<template>
  <div>
    <div class="app-head">
      <h1 class="app-title">Quotes Collection</h1>
      <div class="app-head-button-group">
        <button :disabled="source === 'page'" @click="source = 'page'"
          >Page</button
        >
        <button :disabled="source === 'all'" @click="source = 'all'"
          >All</button
        >
        <div class="app-head-icon-button-group">
          <button title="setting"><BIconGearFill /></button>
        </div>
      </div>
    </div>
    <div>
      <div class="search-input">
        <BIconSearch />
        <input
          v-model="searchKeyword"
          :placeholder="`Search quotes${
            source === 'page' ? ' of this page' : ''
          }...`"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.app-head {
  padding: 10px 0;
  display: flex;
  flex-grow: 1;
  justify-content: space-between;

  .app-title {
    margin: 0 10px 0 0;
    font-size: 16px;
  }

  &-button-group {
    display: flex;

    button {
      background-color: transparent;
      border: 1px solid rgb(217, 217, 217);
      height: 24px;
      width: 4em;
      border-radius: 4px;
      cursor: pointer;

      &:disabled {
        background-color: transparent;
        color: rgb(24, 144, 255);
        border-color: currentColor;
      }
    }
  }

  &-icon-button-group {
    margin-left: 4px;

    button {
      display: flex;
      align-items: center;
      width: fit-content;
      border: 0;
      cursor: pointer;
    }
  }
}

.search-input {
  position: relative;
  margin-bottom: 16px;
  font-size: 14px;

  $icon-left: 8px;

  svg {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: $icon-left;
  }

  input {
    padding-left: calc(1.2em + $icon-left);
    width: 100%;
    box-sizing: border-box;
    height: 32px;
  }
}
</style>
