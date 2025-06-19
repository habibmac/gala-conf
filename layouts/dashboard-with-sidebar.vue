<!-- layouts/dashboard-with-sidebar.vue -->
<script setup lang="ts">
import { useUIStore } from '@/stores';

const uiStore = useUIStore();
const authStore = useAuthStore();
const route = useRoute();
const { checkAccess, isModalOpen, unauthorizedReason } = useAuth();

// ✅ Only check access when authenticated
watch(
  [() => route.fullPath, () => authStore.isAuthenticated, () => authStore.userInfo],
  ([isAuth, userInfo]) => {
    if (isAuth && userInfo) {
      checkAccess(route.meta);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Sidebar
    :sidebar-open="uiStore.isSidebarOpen ?? false"
    @close-sidebar="uiStore.setSidebarExpanded(false)"
    @toggle-sidebar="uiStore.toggleSidebar()"
  />
  <div class="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
    <NavBar :show-events="true" :sidebar-open="uiStore.isSidebarOpen ?? false" @toggle-sidebar="uiStore.toggleSidebar()" />
    <main class="grow">
      <div class="relative h-full">
        <slot />
        <!-- ✅ Only show modal when authenticated but unauthorized -->
        <ModalAuth
          v-if="authStore.isAuthenticated"
          :open="isModalOpen"
          :reason="unauthorizedReason"
          @close="isModalOpen = false"
        />
      </div>
    </main>
  </div>
</template>
