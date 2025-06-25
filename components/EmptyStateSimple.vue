<script setup lang="ts">
import { Icon } from '@iconify/vue';

// Define props with default values
withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
  }>(),
  {
    title: 'No data found',
    description: 'There are no records to display at this time.',
    icon: 'solar:empty-state',
  },
);
</script>

<template>
  <div class="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
    <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
      <Icon :icon="icon" class="size-8 text-gray-400" />
    </div>
    <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
      {{ title }}
    </h3>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {{ description }}
    </p>
  </div>
</template>
