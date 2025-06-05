<script setup lang="ts">
import { cn } from '~/lib/utils';

const props = defineProps({
  dotClass: {
    default: 'w-2 h-2 bg-green-500',
    type: String,
  },
  pulseClass: {
    default: 'w-3 h-3 bg-green-300',
    type: String,
  },
  wrapperClass: {
    default: '',
    type: String,
  },
});
</script>

<template>
  <div class="flex items-center">
    <div :class="cn('relative flex items-center justify-center', wrapperClass)">
      <div :class="cn('absolute inline-flex h-full w-full animate-ping rounded-full', props.pulseClass)" />
      <div :class="cn('relative inline-flex rounded-full', dotClass)" />
    </div>
  </div>
</template>
