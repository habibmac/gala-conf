<script setup lang="ts">
onMounted(() => {
  if (localStorage.getItem("sidebar-expanded") === "true") {
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
