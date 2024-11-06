<script setup lang="ts">
import { createFilterWrapper } from '@vueuse/core';
import { twMerge } from 'tailwind-merge';
import { cn } from '~/lib/utils';

const props = defineProps({
  wrapperClass: {
    type: String,
    default: '',
  },
  pulseClass: {
    type: String,
    default: 'w-3 h-3 bg-green-300',
  },
  dotClass: {
    type: String,
    default: 'w-2 h-2 bg-green-500',
  },
});
</script>
<template>
  <div class="flex items-center">
    <div :class="cn('relative flex items-center justify-center', wrapperClass)">
      <div :class="cn('absolute inline-flex h-full w-full animate-ping rounded-full', props.pulseClass)"></div>
      <div :class="cn('relative inline-flex rounded-full', dotClass)"></div>
    </div>
  </div>
</template>
