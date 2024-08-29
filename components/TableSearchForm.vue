<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";

const props = defineProps({
  modelValue: String,
  placeholder: {
    type: String,
    default: "Search…",
  },
});

const emits = defineEmits(["update:modelValue"]);

const inputQuery = ref(props.modelValue);

const updateQuery = useDebounceFn(() => {
  emits("update:modelValue", inputQuery.value);
}, 500);

const searchImmediately = () => {
  emits("update:modelValue", inputQuery.value);
};

const clearSearch = () => {
  inputQuery.value = "";
  emits("update:modelValue", "");
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
    <label for="action-search" class="sr-only">Search</label>
    <input
      id="action-search"
      class="form-input with-icon w-full min-w-40 text-slate-200 lg:w-auto"
      type="search"
      v-model="inputQuery"
      @input="updateQuery"
      :placeholder="props.placeholder"
    />
    <button @click="searchImmediately">
      <svg
        class="absolute inset-y-0 left-3 my-auto mr-2 h-4 w-4 shrink-0 fill-current text-slate-400 group-hover:text-blue-500 group-focus:text-blue-500 dark:text-slate-500 dark:group-hover:text-slate-400"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"
        />
        <path
          d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z"
        />
      </svg>
    </button>
    <button
      @click="clearSearch"
      class="absolute right-0 top-1/2 mr-2 -translate-y-1/2"
      v-if="inputQuery"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="-2 -2 24 24"
      >
        <path
          fill="currentColor"
          d="m11.414 10l2.829-2.828a1 1 0 1 0-1.415-1.415L10 8.586L7.172 5.757a1 1 0 0 0-1.415 1.415L8.586 10l-2.829 2.828a1 1 0 0 0 1.415 1.415L10 11.414l2.828 2.829a1 1 0 0 0 1.415-1.415zM10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10s-4.477 10-10 10"
        />
      </svg>
    </button>
  </div>
</template>
