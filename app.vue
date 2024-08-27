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
  <div class="flex h-[100dvh] overflow-hidden">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
