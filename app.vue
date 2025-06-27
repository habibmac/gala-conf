<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Galanesia ID` : 'Galanesia ID';
  },
});
</script>

<template>
  <NuxtPwaManifest />
  <div class="flex h-dvh bg-background font-geist">
    <NuxtLoadingIndicator color="#34d399" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Sonner position="top-center" />
  </div>
</template>
