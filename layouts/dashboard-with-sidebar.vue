<script setup lang="ts">
import { useUIStore } from '@/stores';

const uiStore = useUIStore();

const route = useRoute();
const { checkAccess, isModalOpen, unauthorizedReason } = useAuth();

// Check access whenever route changes
watch(
  () => route.fullPath,
  () => {
    checkAccess(route.meta);
  },
  { immediate: true }
);
</script>
<template>
  <Sidebar
    :sidebar-open="uiStore.isSidebarOpen"
    @close-sidebar="uiStore.setSidebarExpanded(false)"
    @toggle-sidebar="uiStore.toggleSidebar()"
  />
  <div class="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
    <NavBar :show-events="true" :sidebar-open="uiStore.isSidebarOpen" @toggle-sidebar="uiStore.toggleSidebar()" />
    <main class="grow">
      <div class="relative h-full">
        <slot />
        <ModalAuth :open="isModalOpen" :reason="unauthorizedReason" @close="isModalOpen = false" />
      </div>
    </main>
  </div>
</template>
