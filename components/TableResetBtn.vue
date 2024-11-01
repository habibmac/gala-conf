<script setup lang="ts">
import { Icon } from '@iconify/vue';
const emit = defineEmits(['resetFilters']);

// Emit an event to reset filters
const handleResetFilters = () => {
  emit('resetFilters');
};
</script>
<template>
  <button
    @click="handleResetFilters"
    type="button"
    class="flex items-center space-x-1 text-xs px-3 py-2 h-10 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors dark:hover:text-slate-200"
  >
    <span>Reset</span>
    <Icon icon="iconamoon:close-thin" class="w-6 h-6 dark:text-slate-600" />
  </button>
</template>
