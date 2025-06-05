<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineProps<{
  name: string
  width?: string | number
  height?: string | number
}>();
</script>

<template>
  <Icon :icon="name" :width="width" :height="height" />
</template>
