<script setup lang="ts">
const emit = defineEmits(["resetFilters"]);

// Emit an event to reset filters
const handleResetFilters = () => {
  emit("resetFilters");
};
</script>
<template>
  <button
    @click="handleResetFilters"
    type="button"
    class="group flex items-center space-x-1 bg-transparent text-xs text-red-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
  >
    <svg
      class="h-5 w-5 shrink-0 fill-current transition group-hover:rotate-90 dark:text-slate-400 dark:group-hover:text-red-500"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        d="M17.65 6.35A7.958 7.958 0 0 0 12 4a8 8 0 0 0-8 8a8 8 0 0 0 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18a6 6 0 0 1-6-6a6 6 0 0 1 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"
      />
    </svg>
    <span>Remove filters</span>
  </button>
</template>
