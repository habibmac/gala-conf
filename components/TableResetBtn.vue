<script setup lang="ts">
import { Icon } from '@iconify/vue';

const emit = defineEmits(['reset-filters']);

// Emit an event to reset filters
const handleResetFilters = () => {
  emit('reset-filters');
};
</script>

<template>
  <button
    type="button"
    class="flex h-10 items-center space-x-1 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-white dark:hover:bg-slate-800 dark:hover:text-slate-200"
    @click="handleResetFilters"
  >
    <span>Reset</span>
    <Icon icon="iconamoon:close-thin" class="size-6 dark:text-slate-600" />
  </button>
</template>
