<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineProps({
  title: String,
  value: [Number, String],
  subtitle: String,
  icon: String,
  gradient: String,
  loading: Boolean,
});
</script>

<template>
  <div
    class="relative overflow-hidden rounded-lg bg-gradient-to-br p-6"
    :class="[
      gradient || 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900',
    ]"
  >
    <Icon v-if="icon" :icon="icon" class="absolute right-4 top-4 size-8 text-white/20" />
    <div class="space-y-2">
      <p class="text-sm font-medium text-white/90">
        {{ title }}
      </p>
      <p class="text-3xl font-semibold text-white">
        {{ formatThousands(Number(value)) }}
      </p>
      <p v-if="subtitle" class="text-xs text-white/70">
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>
