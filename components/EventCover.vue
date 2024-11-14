<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { devImgPath } from '~/utils';

defineProps({
  src: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 8,
  },
  online: {
    type: Number,
    default: 3,
  },
  right: {
    type: Number,
    default: 0.5,
  },
  wrapperClass: {
    type: String,
    default: '',
  },
  imgClass: {
    type: String,
    default: 'w-full h-full',
  },
});
</script>
<template>
  <Avatar :class="wrapperClass" shape="eventLogo">
    <AvatarImage :src="devImgPath(src)" :alt="title" loading="lazy" />
    <AvatarFallback class="bg-muted h-full w-full p-1 flex items-center justify-center">
      <Icon icon="heroicons-solid:photograph" class="text-muted-foreground w-10 h-10" />
    </AvatarFallback>
  </Avatar>
</template>
