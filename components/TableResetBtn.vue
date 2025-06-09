<script setup lang="ts">
import { Icon } from '@iconify/vue';

const emit = defineEmits(['reset-filters']);

// Emit an event to reset filters
const handleResetFilters = () => {
  emit('reset-filters');
};
</script>

<template>
  <div>
    <Button
      type="button"
      variant="outline"
      class="h-[42px] w-auto"
      @click="handleResetFilters"
    >
      Reset
      <Icon icon="iconamoon:close-thin" class="size-6 dark:text-slate-600" />
    </Button>
  </div>
</template>
