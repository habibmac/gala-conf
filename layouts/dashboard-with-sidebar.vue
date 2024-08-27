<script setup lang="ts">
import { useSiteStore } from "@/stores";

const siteStore = useSiteStore();

onBeforeMount(() => {
  // Initialize the sidebar state
  siteStore.initSidebarExpanded();
});
</script>
<template>
  <Sidebar
    :sidebar-open="siteStore.isSidebarExpanded"
    @close-sidebar="siteStore.setSidebarExpanded(false)"
  />
  <div
    class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-slate-200 dark:bg-slate-900"
  >
    <NavBar :show-events="true" :sidebar-open="siteStore.isSidebarExpanded" 
    @toggle-sidebar="siteStore.toggleSidebarExpanded()" />

    <main class="grow">
      <div class="translate-y-[-200px] opacity-50 lg:translate-y-[-550px]">
        <div
          class="pointer-events-none absolute -top-16 -z-10 flex w-full justify-center overflow-hidden lg:-top-20"
        >
          <picture>
            <source
              media="(min-width: 100px)"
              srcset="@/assets/images/glow-homepage.webp"
            />
            <img alt="" class="sm:max-w-none sm:object-cover sm:object-top" />
          </picture>
        </div>
      </div>
      <div class="relative h-full">
        <slot />
      </div>
    </main>
  </div>
</template>
