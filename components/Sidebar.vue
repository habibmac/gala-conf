<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useLocalStorage } from '#imports';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import { useMenu } from '@/composables/useMenu';
import MenuIcon from '@/components/MenuIcon.vue';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo.vue';

const props = defineProps(['sidebarOpen']);
const emit = defineEmits(['close-sidebar']);

const { menuItems } = useMenu();
const { isLoading: isFetchingEvent } = useEvent();

const trigger = ref<HTMLElement | null>(null);
const sidebar = ref<HTMLElement | null>(null);

const breakpoints = useBreakpoints(breakpointsTailwind);
const lgAndSmaller = breakpoints.smallerOrEqual('lg');
const isLargeScreen = breakpoints.greater('lg');

const sidebarExpanded = useLocalStorage('sidebar-expanded', false);

const clickHandler = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!sidebar.value || !trigger.value) return;

  // Close sidebar if clicking outside when sidebar is open on small screens
  if (props.sidebarOpen && lgAndSmaller.value && !sidebar.value.contains(target) && !trigger.value.contains(target)) {
    emit('close-sidebar');
    return;
  }

  // Close sidebar when clicking on a menu item on small screens
  if (props.sidebarOpen && lgAndSmaller.value && sidebar.value.contains(target) && target.closest('a')) {
    emit('close-sidebar');
    return;
  }
};

const keyHandler = (event: KeyboardEvent) => {
  if (!props.sidebarOpen || event.key !== 'Escape' || !lgAndSmaller.value) return;
  emit('close-sidebar');
};

const updateBodyClass = () => {
  if (import.meta.client) {
    if (sidebarExpanded.value) {
      document.body.classList.add('sidebar-expanded');
    } else {
      document.body.classList.remove('sidebar-expanded');
    }
  }
};

watch(sidebarExpanded, () => {
  updateBodyClass();
});

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
  <div class="min-w-fit relative z-30">
    <!-- Sidebar backdrop (mobile only) -->
    <div
      class="fixed inset-0 z-20 bg-slate-900 bg-opacity-30 transition-opacity duration-200 lg:z-auto lg:hidden"
      :class="sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'"
      aria-hidden="true"
    ></div>

    <!-- Sidebar -->
    <div
      id="sidebar"
      ref="sidebar"
      class="no-scrollbar lg:sidebar-expanded:!w-64 z-40 absolute left-0 top-0 flex h-[100dvh] w-64 shrink-0 flex-col overflow-y-scroll bg-gradient-to-t from-blue-700 to-blue-700 transition-all duration-200 ease-in-out lg:static lg:left-auto lg:top-auto lg:w-20 lg:translate-x-0 lg:overflow-y-auto"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-64'"
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
          class="text-slate-300 hover:text-slate-100 lg:hidden hover:bg-transparent"
          @click.stop="$emit('close-sidebar')"
          aria-controls="sidebar"
          :aria-expanded="sidebarOpen"
        >
          <span class="sr-only">Close sidebar</span>
          <Icon icon="material-symbols-light:close-rounded" class="h-7 w-7" />
        </Button>
        <!-- Logo -->
        <NuxtLink to="/my-events" class="mx-auto">
          <Logo class="h-12 w-12 fill-white" />
        </NuxtLink>
      </div>
      <!-- Links -->
      <div v-if="isFetchingEvent" class="grid gap-4 p-4">
        <Skeleton v-for="i in 3" class="h-8 bg-slate-200/20 p-4" />
      </div>
      <div class="space-y-8 p-4" v-else-if="menuItems">
        <!-- Pages group -->
        <div v-for="group in menuItems" :key="group.id">
          <h3 v-if="group.label" class="pl-3 text-xs uppercase tracking-wider text-slate-400">
            <span class="lg:sidebar-expanded:hidden hidden w-6 text-center lg:block" aria-hidden="true">•••</span>
            <span class="lg:sidebar-expanded:block lg:hidden">{{ group.label }}</span>
          </h3>
          <ul class="mt-2">
            <NuxtLink
              v-for="(linkItem, index) in group.menus"
              :to="linkItem.generatedLink?.path"
              custom
              v-slot="{ href, navigate, isActive }"
              :key="index"
            >
              <li class="mb-0.5 last:mb-0">
                <a
                  class="flex items-center truncate rounded-md text-slate-200 transition"
                  :class="
                    isActive
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
      <div v-else>Error loading menu items</div>

      <!-- Expand / collapse button -->
      <div class="mt-auto hidden justify-end lg:inline-flex p-4">
        <Button @click="sidebarExpanded = !sidebarExpanded" variant="ghost" size="icon" class="text-slate-200">
          <span class="sr-only">Expand / collapse sidebar</span>
          <Icon icon="radix-icons:pin-right" class="h-6 w-6 sidebar-expanded:rotate-180" />
        </Button>
      </div>
    </div>
  </div>
</template>
