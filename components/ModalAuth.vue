<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

defineProps<{
  open: boolean
  reason: string
}>();

defineEmits<{
  (e: 'close'): void
}>();
</script>

<template>
  <Dialog :open="open" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Access Denied</DialogTitle>
      </DialogHeader>
      <div class="flex flex-col items-center gap-4 py-4">
        <Icon icon="solar:forbidden-circle-bold" class="size-16 text-red-500" />
        <p class="text-center text-gray-600">
          {{ reason }}
        </p>
        <NuxtLink to="/my-events" class="text-blue-500 hover:text-blue-600">
          Return to My Events
        </NuxtLink>
      </div>
    </DialogContent>
  </Dialog>
</template>
