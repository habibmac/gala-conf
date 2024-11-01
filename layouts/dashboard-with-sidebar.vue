<script setup lang="ts">
import { useSiteStore } from '@/stores';

const siteStore = useSiteStore();

onBeforeMount(() => {
  // Initialize the sidebar state
  siteStore.initSidebarExpanded();
});
</script>
<template>
  <Sidebar :sidebar-open="siteStore.isSidebarExpanded" @close-sidebar="siteStore.setSidebarExpanded(false)" />
  <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
    <NavBar
      :show-events="true"
      :sidebar-open="siteStore.isSidebarExpanded"
      @toggle-sidebar="siteStore.toggleSidebarExpanded()"
    />

    <main class="grow">
      <div class="relative h-full">
        <slot />
      </div>
    </main>
  </div>
</template>
