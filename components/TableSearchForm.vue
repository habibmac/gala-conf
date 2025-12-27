<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useDebounceFn } from '@vueuse/core';
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    default: '',
    type: String,
  },
  placeholder: {
    default: 'Search…',
    type: String,
  },
});

const emits = defineEmits(['update:modelValue']);

const inputQuery = ref(props.modelValue);

const updateQuery = useDebounceFn(() => {
  emits('update:modelValue', inputQuery.value);
}, 500);

const searchImmediately = () => {
  emits('update:modelValue', inputQuery.value);
};

const clearSearch = () => {
  inputQuery.value = '';
  emits('update:modelValue', '');
};

watch(
  () => props.modelValue,
  (newVal) => {
    inputQuery.value = newVal;
  },
);
</script>

<template>
  <div class="group relative">
    <input
      id="action-search"
      v-model="inputQuery"
      class="form-input with-icon h-10 w-full min-w-40 text-slate-200 lg:w-auto"
      type="search"
      :placeholder="props.placeholder"
      @input="updateQuery"
    >
    <button class="absolute left-3 top-1/2 -translate-y-1/2" @click="searchImmediately">
      <Icon icon="tabler:search" class="size-4" />
    </button>
    <button v-if="inputQuery" class="absolute right-2 top-1/2 -translate-y-1/2" @click="clearSearch">
      <Icon icon="tabler:x" class="size-4" />
    </button>
  </div>
</template>
