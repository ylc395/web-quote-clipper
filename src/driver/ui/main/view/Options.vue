<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  watch,
  onUnmounted,
  reactive,
} from 'vue';
import { container } from 'tsyringe';
import debounce from 'lodash.debounce';
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
  SelectOption,
  FormInst,
} from 'naive-ui';
import Router from 'driver/ui/main/service/RouterService';
import repository from 'driver/ui/main/service/repository';
import ConfigService from 'service/ConfigService';
import { DbTypes } from 'model/db';
import { AppConfig, OperationTypes } from 'model/config';

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
    const formModel = ref<Partial<AppConfig>>({});
    const formRef = ref<FormInst | undefined>();

    const notesOptions = ref<SelectOption[]>([]);
    const searchingStatus = reactive<{
      feedback?: string;
      validationStatus?: string;
      loading: boolean;
    }>({ loading: false });

    const searchNotes = debounce(async (keyword: string, isId = false) => {
      if (!formModel.value.db) {
        throw new Error('no db');
      }

      searchingStatus.loading = true;
      try {
        const notes = await repository.searchNotes(
          formModel.value.db,
          keyword,
          isId,
        );
        notesOptions.value = notes.map(({ id: value, path }) => {
          const paths = path.split('/');
          return {
            value,
            label: paths[paths.length - 1],
          };
        });
      } catch (error) {
        console.log(error);
        searchingStatus.feedback = 'Can not connect to Joplin';
        searchingStatus.validationStatus = 'error';
      }

      searchingStatus.loading = false;
    }, 500);

    const needTarget = computed(
      () =>
        formModel.value.operation === OperationTypes.Persist &&
        formModel.value.db === DbTypes.Joplin,
    );

    const formRules = computed(() =>
      needTarget.value ? { targetId: { required: true } } : {},
    );

    const save = async () => {
      searchingStatus.feedback = undefined;
      searchingStatus.validationStatus = undefined;

      try {
        await formRef.value!.validate();
      } catch {
        return;
      }
      await config.update(formModel.value);
      router.views.options = false;
    };

    config.getAll().then((v) => (formModel.value = v));

    watch(
      () => formModel.value.db,
      async () => {
        if (needTarget.value && formModel.value.targetId) {
          await searchNotes(formModel.value.targetId, true);
        }
      },
      { immediate: true },
    );

    window.addEventListener('unload', repository.destroyNotesFinder);
    onUnmounted(() => {
      window.removeEventListener('unload', repository.destroyNotesFinder);
      repository.destroyNotesFinder();
    });

    return {
      save,
      router,
      formModel,
      formRef,
      formRules,
      needTarget,
      DbTypes,
      OperationTypes,
      notesOptions,
      searchNotes,
      searchingStatus,
    };
  },
});
</script>
<template>
  <div class="option-page">
    <NForm :rules="formRules" :model="formModel" ref="formRef">
      <NFormItem label="Database:" path="db">
        <NRadioGroup v-model:value="formModel.db">
          <NSpace>
            <NRadio :value="DbTypes.Joplin">Joplin</NRadio>
            <NRadio :value="DbTypes.Browser">Browser</NRadio>
          </NSpace>
        </NRadioGroup>
      </NFormItem>
      <NFormItem
        v-if="formModel.db === DbTypes.Joplin"
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
      <NFormItem
        v-if="needTarget"
        label="Target Note:"
        path="targetId"
        v-bind="searchingStatus"
      >
        <NSelect
          remote
          filterable
          v-model:value="formModel.targetId"
          placeholder="Search Note In Joplin"
          :loading="searchingStatus.loading"
          :show="searchingStatus.feedback ? false : undefined"
          @search="searchNotes"
          :options="notesOptions"
          :input-props="{
            autocomplete: 'disabled',
          }"
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
