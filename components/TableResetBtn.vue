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
      class="w-auto md:h-[42px]"
      @click="handleResetFilters"
    >
      Reset
      <Icon icon="tabler:x" class="ml-2 size-4 dark:text-slate-600" />
    </Button>
  </div>
</template>
