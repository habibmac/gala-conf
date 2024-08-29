<script setup lang="ts">
defineProps({
  filter: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["clear-filter"]);

const handleClearFilter = () => {
  // Emit an event to clear the filter
  emit("clear-filter");
};
</script>
<template>
  <button
    v-if="filter !== ''"
    class="group inline-flex items-center justify-center space-x-2 overflow-hidden rounded-full border border-slate-200 bg-white pr-2 text-sm font-medium leading-5 text-slate-500 shadow-sm duration-150 ease-in-out hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
    @click="handleClearFilter"
  >
    <div
      class="bg-slate-400 px-3 py-1 text-xs text-white group-hover:bg-slate-500 dark:bg-slate-700 dark:group-hover:bg-slate-700"
    >
      {{ label }}
    </div>
    <div
      class="ml-2 line-clamp-1 max-w-sm overflow-ellipsis group-hover:text-slate-700 dark:group-hover:text-slate-300"
    >
      {{ filter }}
    </div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 text-red-400 group-hover:text-red-600 dark:text-red-600 dark:group-hover:text-red-500"
      viewBox="0 0 24 24"
    >
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="m7 7l10 10M7 17L17 7"
      />
    </svg>
  </button>
</template>
