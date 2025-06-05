<script setup lang="ts">
import Toaster from '@/components/ui/toast/Toaster.vue';

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Galanesia ID` : 'Galanesia ID';
  },
});
</script>

<template>
  <div class="flex h-dvh bg-background">
    <NuxtLoadingIndicator color="#34d399" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster />
  </div>
</template>
