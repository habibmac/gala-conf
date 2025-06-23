<script setup lang="ts">
import { computed } from 'vue';

import { getStatusInfo } from '@/utils/status-map';

interface Props {
  code: string
  statusId?: string
  size?: 'xs' | 'sm' | 'base'
  variant?: 'colored' | 'muted'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'xs',
  variant: 'colored',
});

const statusInfo = computed(() => getStatusInfo(props.statusId || ''));

const classes = computed(() => {
  const sizeClass = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
  }[props.size];

  const colorClass = props.variant === 'colored'
    ? statusInfo.value.textClass
    : 'text-muted-foreground';

  return `${sizeClass} ${colorClass} number tabular-nums`;
});
</script>

<template>
  <span :class="[classes, $props.class]">{{ code }}</span>
</template>
