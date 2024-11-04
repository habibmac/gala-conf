<script setup lang="ts">
import { useSiteStore } from '@/stores';

const siteStore = useSiteStore();

onBeforeMount(() => {
  // Initialize the sidebar state
  siteStore.initSidebarExpanded();
});

const route = useRoute();
const { checkAccess, isModalOpen, unauthorizedReason } = useAuth();

// Check access whenever route changes
watch(() => route.fullPath, () => {
    checkAccess(route.meta);
}, { immediate: true });
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
        <ModalAuth 
            :open="isModalOpen" 
            :reason="unauthorizedReason"
            @close="isModalOpen = false"
        />
      </div>
    </main>
  </div>
</template>
