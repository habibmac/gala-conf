<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { Toaster as Sonner } from 'vue-sonner'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner 
    class="group toaster" 
    v-bind="props" 
    theme="system" 
    :toast-options="{
      classes: {
        toast: 'group toast border shadow-lg',
        description: 'text-xs !text-slate-200',
        actionButton: 'bg-primary text-primary-foreground',
        cancelButton: 'bg-muted text-muted-foreground',
      },
    }"
  />
</template>