<script setup lang="ts">
import { useLocalStorage } from "#imports";

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Galanesia ID` : 'Galanesia ID';
  }
})

onMounted(() => {
  if (useLocalStorage("sidebar-expanded", false)) {
    document.body.classList.add("sidebar-expanded");
  } else {
    document.body.classList.remove("sidebar-expanded");
  }
});
</script>
<template>
  <div class="flex h-[100dvh] bg-background">
    <NuxtLoadingIndicator color="#34d399" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
