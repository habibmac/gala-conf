<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
  icon?: string
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  description: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
  icon: 'heroicons:exclamation-triangle',
  loading: false,
});

defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>();
</script>

<template>
  <Dialog :open="open" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2" :class="variant === 'destructive' ? 'text-destructive' : ''">
          <Icon :icon="icon" class="size-5" />
          {{ title }}
        </DialogTitle>
      </DialogHeader>

      <div class="py-4">
        <div v-if="description" class="space-y-2" v-html="description" />
        <slot />
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" :disabled="loading" @click="$emit('close')">
          {{ cancelText }}
        </Button>
        <Button
          :variant="variant"
          :disabled="loading"
          class="min-w-[100px]"
          @click="$emit('confirm')"
        >
          <Icon v-if="loading" icon="heroicons:arrow-path" class="mr-2 size-4 animate-spin" />
          {{ confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
