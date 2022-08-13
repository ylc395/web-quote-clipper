<script lang="ts">
import { defineComponent, ref } from 'vue';
import { container } from 'tsyringe';
import { BIconX } from 'bootstrap-icons-vue';
import {
  NRadioGroup,
  NRadio,
  NSpace,
  NForm,
  NFormItem,
  NSelect,
  NAutoComplete,
  NButton,
} from 'naive-ui';
import Router from 'driver/ui/main/service/RouterService';
import ConfigService from 'service/ConfigService';
import { DbTypes } from 'model/db';
import { OperationTypes } from 'model/config';

export default defineComponent({
  components: {
    BIconX,
    NRadioGroup,
    NRadio,
    NSpace,
    NForm,
    NFormItem,
    NSelect,
    NAutoComplete,
    NButton,
  },
  setup() {
    const router = container.resolve(Router);
    const config = container.resolve(ConfigService);
    const formModel = ref(config.getAll());
    const save = async () => {
      await config.update(formModel.value);
      router.views.options = false;
    };

    return {
      router,
      save,
      formModel,
      DbTypes,
      OperationTypes,
    };
  },
});
</script>
<template>
  <div class="option-page">
    <NForm>
      <NFormItem label="Database:">
        <NRadioGroup v-model:value="formModel.db">
          <NSpace>
            <NRadio :value="DbTypes.Joplin">Joplin</NRadio>
            <NRadio :value="DbTypes.Browser">Browser</NRadio>
          </NSpace>
        </NRadioGroup>
      </NFormItem>
      <NFormItem
        label="What happen when click highlight button:"
        path="operation"
      >
        <NSelect
          v-model:value="formModel.operation"
          :options="[
            {
              label: 'Copy As Markdown Text',
              value: OperationTypes.ClipboardInline,
            },
            {
              label: 'Copy As Markdown Blockquote Text',
              value: OperationTypes.ClipboardBlock,
            },
            { label: 'Save To Joplin Note', value: OperationTypes.Persist },
          ]"
        />
      </NFormItem>
      <NFormItem label="Target Note:" path="targetId">
        <NAutoComplete
          v-model:value="formModel.targetId"
          placeholder="Search Note In Joplin"
        />
      </NFormItem>
    </NForm>
    <NSpace justify="end">
      <NButton @click="save" type="primary">Confirm</NButton>
      <NButton @click="router.views.options = false">Cancel</NButton>
    </NSpace>
  </div>
</template>
<style>
.option-page {
  background-color: #fff;
  padding: 10px;
}
</style>
