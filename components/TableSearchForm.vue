<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { Icon } from '@iconify/vue';

const props = defineProps({
  modelValue: String,
  placeholder: {
    type: String,
    default: 'Search…',
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
  }
);
</script>

<template>
  <div class="group relative">
    <input
      id="action-search"
      class="form-input with-icon w-full min-w-40 text-slate-200 lg:w-auto"
      type="search"
      v-model="inputQuery"
      @input="updateQuery"
      :placeholder="props.placeholder"
    />
    <button @click="searchImmediately" class="absolute top-1/2 -translate-y-1/2 left-3">
      <Icon icon="ion:search-outline" class="size-4" />
    </button>
    <button @click="clearSearch" class="absolute right-2 top-1/2 -translate-y-1/2" v-if="inputQuery">
      <Icon icon="ion:close-circle" class="size-4" />
    </button>
  </div>
</template>
