<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { Toaster as Sonner } from 'vue-sonner'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner class="group toaster" v-bind="props" theme="system" richColors :toast-options="{
      classes: {
        toast: 'group toast border shadow-lg',
        description: 'text-xs',
        success: 'bg-emerald-500 !text-white',
        error: 'bg-red-500 !text-white',
        actionButton: 'bg-primary text-primary-foreground',
        cancelButton: 'bg-muted text-muted-foreground',
      },
    }" />
</template>