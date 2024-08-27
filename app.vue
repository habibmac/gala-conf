<script setup lang="ts">
import { useLocalStorage } from "#imports";

onMounted(() => {
  if (useLocalStorage("sidebar-expanded", false)) {
    document.body.classList.add("sidebar-expanded");
  } else {
    document.body.classList.remove("sidebar-expanded");
  }
});
</script>
<template>
  <div class="flex relative h-[100dvh]">
    <NuxtLoadingIndicator color="#34d399" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
