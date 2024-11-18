<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import { useMenu } from '@/composables/useMenu';
import MenuIcon from '@/components/MenuIcon.vue';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo.vue';

const props = defineProps<{
  sidebarOpen: boolean;
}>();

const emit = defineEmits(['close-sidebar']);

const route = useRoute();
const currentPath = computed(() => route.path);
const currentEventId = computed(() => route.params.eventId as string);

const { menuItems } = useMenu();

const { event, isLoading: isEventLoading, isRefetching: isEventRefetching, isError: isEventError } = useEvent();

const trigger = ref<HTMLElement | null>(null);
const sidebar = ref<HTMLElement | null>(null);

const breakpoints = useBreakpoints(breakpointsTailwind);
const lgAndSmaller = breakpoints.smallerOrEqual('lg');
const isLargeScreen = breakpoints.greater('lg');

const uiStore = useUIStore();

const clickHandler = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!sidebar.value) return;

  // Check if clicking navbar hamburger button
  const navbarHamburger = document.querySelector('#sidebar-trigger');
  if (navbarHamburger?.contains(target)) {
    return;
  }

  // For small screens and sidebar is open
  if (props.sidebarOpen && lgAndSmaller.value) {
    // Close if clicking outside sidebar
    if (!sidebar.value.contains(target)) {
      emit('close-sidebar');
      return;
    }

    // Close if clicking on a link
    if (target.closest('a')) {
      emit('close-sidebar');
      return;
    }
  }
};

const keyHandler = (event: KeyboardEvent) => {
  if (!props.sidebarOpen || event.key !== 'Escape' || !lgAndSmaller.value) return;
  emit('close-sidebar');
};

const isMenuItemActive = (linkPath: string | undefined) => {
  if (!linkPath) return false;

  // For home/dashboard route, only match exact path
  if (linkPath.endsWith('/event/' + currentEventId.value)) {
    return currentPath.value === linkPath;
  }

  // For other routes, use startsWith
  return currentPath.value.startsWith(linkPath);
};

// Handle sidebar toggle for large screens only
const handleToggleSidebar = () => {
  uiStore.toggleSidebar();
};

// For smaller screens, just emit the event without updating preferences
const handleCloseSidebar = () => {
  if (lgAndSmaller.value) {
    emit('close-sidebar');
  }
};

watch(isLargeScreen, (isLarge) => {
  if (isLarge && props.sidebarOpen) {
    emit('close-sidebar');
  }
});

onMounted(() => {
  document.addEventListener('click', clickHandler);
  document.addEventListener('keydown', keyHandler);
});

onUnmounted(() => {
  document.removeEventListener('click', clickHandler);
  document.removeEventListener('keydown', keyHandler);
});
</script>

<template>
  <ClientOnly>
    <div class="min-w-fit relative z-30">
      <!-- Sidebar backdrop (mobile only) -->
      <div
        class="fixed inset-0 z-20 bg-slate-900 bg-opacity-30 transition-opacity duration-200 lg:z-auto lg:hidden"
        :class="sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'"
        aria-hidden="true"
        @click="handleCloseSidebar"
      />
      <!-- Sidebar -->
      <div
        id="sidebar"
        ref="sidebar"
        class="no-scrollbar lg:sidebar-expanded:!w-64 z-30 absolute left-0 top-0 flex h-[100dvh] w-64 shrink-0 flex-col overflow-y-scroll bg-gradient-to-t from-blue-700 to-blue-700 transition-all duration-200 ease-in-out lg:static lg:left-auto lg:top-auto lg:w-20 lg:translate-x-0 lg:overflow-y-auto"
        :class="[
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          { 'sidebar-expanded': sidebarOpen && isLargeScreen },
        ]"
      >
        <!-- Sidebar header -->
        <div
          class="flex items-center justify-between bg-gradient-to-tr from-blue-700 via-blue-700 to-sky-400 p-2 sm:px-4"
        >
          <!-- Close button -->
          <Button
            ref="trigger"
            variant="ghost"
            size="icon"
            class="text-slate-300 hover:text-slate-100 lg:hidden hover:bg-transparent absolute top-4 right-4"
            aria-controls="sidebar"
            :aria-expanded="sidebarOpen"
            @click="handleCloseSidebar"
          >
            <span class="sr-only">Close sidebar</span>
            <Icon icon="material-symbols-light:close-rounded" class="h-7 w-7" />
          </Button>
          <!-- Logo -->
          <NuxtLink to="/my-events" class="mx-auto">
            <Logo svg-class="h-12 w-12 fill-white" />
          </NuxtLink>
        </div>
        <!-- Links -->
        <div v-if="isEventLoading || isEventRefetching" class="grid gap-4 p-4">
          <!-- <Skeleton v-for="i in 3" :key="i" class="h-8 bg-slate-200/20 p-4" /> -->
          Loading.. {{ event }}
        </div>
        <div v-else-if="isEventError">Error loading menu items</div>
        <template v-else>
          <div v-if="menuItems" class="space-y-8 p-4">
            <!-- Pages group -->
            <div v-for="group in menuItems" :key="group.id">
              <h3 v-if="group.label" class="pl-3 text-xs uppercase tracking-wider text-slate-400">
                <span class="lg:sidebar-expanded:hidden hidden w-6 text-center lg:block" aria-hidden="true">•••</span>
                <span class="lg:sidebar-expanded:block lg:hidden">{{ group.label }}</span>
              </h3>
              <ul class="mt-2">
                <NuxtLink
                  v-for="(linkItem, index) in group.menus"
                  v-slot="{ href, navigate }"
                  :key="index"
                  :to="linkItem.generatedLink?.path"
                  custom
                >
                  <li class="mb-0.5 last:mb-0">
                    <a
                      class="flex items-center truncate rounded-md text-slate-200 transition"
                      :class="
                        isMenuItemActive(linkItem.generatedLink?.path)
                          ? 'bg-blue-950 hover:bg-blue-950 hover:text-slate-200'
                          : 'hover:bg-blue-900/60 hover:text-white'
                      "
                      :href="href"
                      @click="navigate"
                    >
                      <MenuIcon
                        v-if="linkItem.icon"
                        :name="linkItem.icon"
                        class="h-7 w-7 fill-current shrink-0 px-2.5 p-1.5 box-content"
                      />
                      <span class="lg:sidebar-expanded:opacity-100 text-sm font-medium lg:opacity-0 2xl:opacity-100">{{
                        linkItem.name
                      }}</span>
                    </a>
                  </li>
                </NuxtLink>
              </ul>
            </div>
          </div>
          <div v-else>
            <div class="grid gap-4 p-4">
              <Skeleton v-for="i in 3" :key="i" class="h-8 bg-slate-200/20 p-4" />
            </div>
          </div>
        </template>
        <!-- Expand / collapse button -->
        <div class="mt-auto hidden justify-end lg:inline-flex p-4">
          <Button variant="ghost" size="icon" class="text-slate-200" @click="handleToggleSidebar">
            <span class="sr-only">Expand / collapse sidebar</span>
            <Icon icon="radix-icons:pin-right" class="h-6 w-6 sidebar-expanded:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
