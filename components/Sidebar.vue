<!-- components/Sidebar.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import Logo from '@/components/Logo.vue';
import SidebarLinkGroup from '@/components/SidebarLinkGroup.vue';
import { Button } from '@/components/ui/button';
import { useMenu } from '@/composables/useMenu';

const props = defineProps<{
  sidebarOpen: boolean
}>();

const emit = defineEmits(['close-sidebar']);

const route = useRoute();
const currentPath = computed(() => route.path);
const currentEventId = computed(() => route.params.eventId as string);

const { menuItems } = useMenu();
const { isError: isEventError, isLoading: isEventLoading, isRefetching: isEventRefetching } = useEvent();

const trigger = ref<HTMLElement | null>(null);
const sidebar = ref<HTMLElement | null>(null);

const breakpoints = useBreakpoints(breakpointsTailwind);
const lgAndSmaller = breakpoints.smallerOrEqual('lg');
const isLargeScreen = breakpoints.greater('lg');

const uiStore = useUIStore();

// Fix: Clear logic for when sidebar is expanded
const isDesktopExpanded = computed(() => {
  return isLargeScreen.value && uiStore.preferences.sidebarExpanded;
});

// When to show expanded content (sub-menus, text, etc.)
const shouldShowExpandedContent = computed(() => {
  if (lgAndSmaller.value) {
    return props.sidebarOpen; // Mobile: show when open
  }
  else {
    return uiStore.preferences.sidebarExpanded; // Desktop: show when expanded
  }
});

// When clicking should navigate vs toggle menu
const shouldNavigateOnClick = computed(() => {
  return !shouldShowExpandedContent.value;
});

function clickHandler(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!sidebar.value)
    return;

  const navbarHamburger = document.querySelector('#sidebar-trigger');
  if (navbarHamburger?.contains(target)) {
    return;
  }

  if (props.sidebarOpen && lgAndSmaller.value) {
    if (!sidebar.value.contains(target)) {
      emit('close-sidebar');
      return;
    }

    // Only close sidebar if clicking on an actual NuxtLink (not menu items with submenus)
    const clickedLink = target.closest('a[href]:not([href="#0"])');
    if (clickedLink) {
      emit('close-sidebar');
    }
  }
}

function keyHandler(event: KeyboardEvent) {
  if (!props.sidebarOpen || event.key !== 'Escape' || !lgAndSmaller.value)
    return;
  emit('close-sidebar');
}

function isMenuItemActive(linkPath: string | undefined) {
  if (!linkPath)
    return false;

  if (linkPath.endsWith(`/event/${currentEventId.value}`)) {
    return currentPath.value === linkPath;
  }

  return currentPath.value.startsWith(linkPath);
}

function handleCloseSidebar() {
  if (lgAndSmaller.value) {
    emit('close-sidebar');
  }
}

// Check if any sub-menu item is active
const isSubMenuActive = (subMenus: any[]) => {
  return subMenus.some(subMenu => isMenuItemActive(subMenu.generatedLink?.path));
};

// Get the default route for a menu item with sub-menus
const getDefaultRoute = (linkItem: any) => {
  if (linkItem.subMenus?.length > 0) {
    return linkItem.subMenus[0].generatedLink?.path;
  }
  return linkItem.generatedLink?.path;
};

// Handle menu item click
const handleMenuItemClick = (linkItem: any, parentLink: any) => {
  if (shouldNavigateOnClick.value) {
    // Sidebar is collapsed - navigate to default route
    const defaultRoute = getDefaultRoute(linkItem);
    if (defaultRoute) {
      navigateTo(defaultRoute);
    }
  }
  else {
    // Sidebar is expanded - toggle the sub-menu
    parentLink.handleClick();
  }
};

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
    <div class="relative z-30 min-w-fit">
      <!-- Sidebar backdrop (mobile only) -->
      <div
        class="fixed inset-0 z-20 bg-slate-900/30 transition-opacity duration-200 lg:z-auto lg:hidden"
        :class="sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'"
        aria-hidden="true"
        @click="handleCloseSidebar"
      />

      <!-- Sidebar -->
      <div
        id="sidebar"
        ref="sidebar"
        class="no-scrollbar absolute left-0 top-0 z-30 flex h-dvh w-64 shrink-0 flex-col overflow-y-scroll bg-gradient-to-t from-blue-700 to-blue-700 transition-all duration-200 ease-in-out lg:static lg:left-auto lg:top-auto lg:w-20 lg:translate-x-0 lg:overflow-y-auto lg:sidebar-expanded:!w-64"
        :class="[
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          { 'sidebar-expanded': isDesktopExpanded },
        ]"
      >
        <!-- Sidebar header -->
        <div
          class="flex items-center justify-between bg-gradient-to-tr from-blue-700 via-blue-700 to-sky-400 p-2 sm:px-4"
        >
          <Button
            ref="trigger"
            variant="ghost"
            size="icon"
            class="absolute right-4 top-4 text-slate-300 hover:bg-transparent hover:text-slate-100 lg:hidden"
            aria-controls="sidebar"
            :aria-expanded="sidebarOpen"
            @click="handleCloseSidebar"
          >
            <span class="sr-only">Close sidebar</span>
            <Icon icon="material-symbols-light:close-rounded" class="size-7" />
          </Button>

          <NuxtLink to="/my-events" class="mx-auto">
            <Logo svg-class="h-12 w-12 fill-white" />
          </NuxtLink>
        </div>

        <!-- Menu items -->
        <div v-if="isEventLoading || isEventRefetching" class="grid gap-4 p-4">
          <Skeleton v-for="i in 3" :key="i" class="h-8 bg-slate-200/20 p-4" />
        </div>
        <div v-else-if="isEventError">
          <div class="p-4 text-sm text-slate-300">
            Error loading menu items
          </div>
        </div>
        <template v-else>
          <div v-if="menuItems" class="space-y-8 p-4">
            <div v-for="group in menuItems" :key="group.id">
              <h3 v-if="group.label" class="pl-3 text-xs uppercase tracking-wider text-slate-400">
                <span class="hidden w-6 text-center lg:block lg:sidebar-expanded:hidden" aria-hidden="true">•••</span>
                <span class="lg:hidden lg:sidebar-expanded:block">{{ group.label }}</span>
              </h3>
              <ul class="mt-2">
                <li v-for="(linkItem, index) in group.menus" :key="index" class="mb-0.5 last:mb-0">
                  <!-- Menu item with sub-menus -->
                  <SidebarLinkGroup
                    v-if="linkItem.subMenus?.length"
                    v-slot="parentLink"
                    :active-condition="isMenuItemActive(linkItem.generatedLink?.path) || isSubMenuActive(linkItem.subMenus)"
                  >
                    <div
                      class="rounded-md transition duration-150"
                      :class="(isMenuItemActive(linkItem.generatedLink?.path) || isSubMenuActive(linkItem.subMenus))
                        ? 'bg-blue-950 hover:bg-blue-950'
                        : 'hover:bg-blue-900/60 text-white'"
                    >
                      <a
                        href="#0"
                        class="block truncate rounded-md px-3 py-2 text-slate-200 transition duration-150"
                        :class="(isMenuItemActive(linkItem.generatedLink?.path) || isSubMenuActive(linkItem.subMenus))
                          ? 'bg-blue-950 hover:bg-blue-950 hover:text-slate-200'
                          : 'hover:bg-blue-900/60 text-white'"
                        @click.prevent="handleMenuItemClick(linkItem, parentLink)"
                      >
                        <div class="flex items-center justify-between">
                          <div class="flex items-center">
                            <Icon v-if="linkItem.icon" :icon="linkItem.icon" class="size-6 shrink-0" />
                            <span
                              class="ml-3 text-sm font-medium duration-200 lg:opacity-0 lg:sidebar-expanded:opacity-100"
                            >
                              {{ linkItem.name }}
                            </span>
                          </div>
                          <!-- Only show chevron when expanded -->
                          <div
                            v-if="shouldShowExpandedContent"
                            class="ml-2 flex shrink-0 duration-200 lg:opacity-0 lg:sidebar-expanded:opacity-100"
                          >
                            <Icon
                              icon="heroicons:chevron-down-20-solid"
                              class="ml-1 size-5 shrink-0 fill-current text-slate-400 transition-transform"
                              :class="parentLink.expanded && 'rotate-180'"
                            />
                          </div>
                        </div>
                      </a>

                      <!-- Sub-menu items - only show when expanded -->
                      <div v-if="shouldShowExpandedContent" class="duration-200 lg:hidden lg:sidebar-expanded:block">
                        <ul class="mt-1 pb-2 pl-9" :class="!parentLink.expanded && 'hidden'">
                          <li
                            v-for="(subMenuItem, subIndex) in linkItem.subMenus"
                            :key="subIndex"
                            class="mb-1"
                          >
                            <NuxtLink
                              :to="subMenuItem.generatedLink?.path"
                              class="block truncate rounded-md px-3 transition duration-150"
                              :class="isMenuItemActive(subMenuItem.generatedLink?.path)
                                ? 'text-indigo-100'
                                : 'text-slate-400 hover:text-slate-200'"
                            >
                              <span
                                class="text-sm font-medium duration-200 lg:opacity-0 lg:sidebar-expanded:opacity-100"
                              >
                                {{ subMenuItem.name }}
                              </span>
                            </NuxtLink>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </SidebarLinkGroup>

                  <!-- Regular menu item without sub-menus -->
                  <div v-else>
                    <NuxtLink
                      :to="linkItem.generatedLink?.path"
                      class="block truncate rounded-md px-3 py-2 text-slate-200 transition duration-150"
                      :class="isMenuItemActive(linkItem.generatedLink?.path)
                        ? 'bg-blue-950 hover:bg-blue-950 hover:text-slate-200'
                        : 'hover:bg-blue-900/60 text-white'"
                    >
                      <div class="flex items-center">
                        <Icon v-if="linkItem.icon" :icon="linkItem.icon" class="size-6 shrink-0" />
                        <span
                          class="ml-3 text-sm font-medium duration-200 lg:opacity-0 lg:sidebar-expanded:opacity-100"
                        >
                          {{ linkItem.name }}
                        </span>
                      </div>
                    </NuxtLink>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </template>

        <!-- Expand / collapse button -->
        <div class="mt-auto hidden justify-end p-4 lg:inline-flex">
          <Button
            variant="ghost"
            size="icon"
            class="text-slate-200"
            @click="uiStore.toggleSidebar"
          >
            <span class="sr-only">Expand / collapse sidebar</span>
            <Icon
              icon="radix-icons:pin-right"
              class="size-6 transition-transform"
              :class="uiStore.preferences.sidebarExpanded && 'rotate-180'"
            />
          </Button>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
