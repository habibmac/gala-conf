<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { devImgPath } from '~/utils';

defineProps({
  imgClass: {
    default: 'w-full h-full',
    type: String,
  },
  online: {
    default: 3,
    type: Number,
  },
  right: {
    default: 0.5,
    type: Number,
  },
  size: {
    default: 8,
    type: Number,
  },
  src: {
    required: true,
    type: String,
  },
  title: {
    default: '',
    type: String,
  },
  wrapperClass: {
    default: '',
    type: String,
  },
});
</script>

<template>
  <Avatar :class="wrapperClass" shape="eventLogo">
    <AvatarImage :src="devImgPath(src)" :alt="title" loading="lazy" />
    <AvatarFallback class="flex size-full items-center justify-center bg-muted p-1">
      <Icon icon="heroicons-solid:photograph" class="size-10 text-muted-foreground" />
    </AvatarFallback>
  </Avatar>
</template>
