<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { useLocalStorage } from "#imports";
import MenuIcon from "~/components/MenuIcon.vue";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/vue";
import Logo from "~/components/Logo.vue";
import { useMenu } from "@/composables/useMenu"; // Make sure this path is correct
import type { RouteLocationRaw } from "vue-router";
import type { MenuItem } from "~/types/menu";

const props = defineProps<{
  sidebarOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close-sidebar"): void;
}>();

const { menuItems } = useMenu();
const { isLoading: isFetchingEvent } = useEvent();

const trigger = ref<HTMLElement | null>(null);
const sidebar = ref<HTMLElement | null>(null);

const breakpoints = useBreakpoints(breakpointsTailwind);
const lgAndSmaller = breakpoints.smallerOrEqual("lg");

const sidebarExpanded = useLocalStorage("sidebar-expanded", false);

onMounted(() => {
  document.addEventListener("click", clickHandler);
  document.addEventListener("keydown", keyHandler);
  updateBodyClass();
});

onUnmounted(() => {
  document.removeEventListener("click", clickHandler);
  document.removeEventListener("keydown", keyHandler);
});

const clickHandler = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!sidebar.value || !trigger.value) return;
  if (
    !props.sidebarOpen ||
    sidebar.value.contains(target) ||
    trigger.value.contains(target) ||
    !lgAndSmaller.value
  )
    return;
  emit("close-sidebar");
};

const keyHandler = (event: KeyboardEvent) => {
  if (!props.sidebarOpen || event.key !== "Escape" || !lgAndSmaller.value)
    return;
  emit("close-sidebar");
};

const updateBodyClass = () => {
  if (import.meta.client) {
    if (sidebarExpanded.value) {
      document.body.classList.add("sidebar-expanded");
    } else {
      document.body.classList.remove("sidebar-expanded");
    }
  }
};

watch(sidebarExpanded, () => {
  updateBodyClass();
});

const toggleSidebar = () => {
  sidebarExpanded.value = !sidebarExpanded.value;
};

const generateLinkTo = (linkItem: MenuItem): RouteLocationRaw => {
  if (linkItem.to.includes(":eventId")) {
    const authStore = useAuthStore();
    const eventId = authStore.selectedEvent?.id;

    if (!eventId) {
      return { path: "/my-events" };
    }

    return { path: linkItem.to.replace(":eventId()", eventId) };
  }
  return { path: linkItem.to };
};
</script>

<template>
  <div class="min-w-fit">
    <!-- Sidebar backdrop (mobile only) -->
    <div
      class="fixed inset-0 z-40 bg-slate-900 bg-opacity-30 transition-opacity duration-200 lg:z-auto lg:hidden"
      :class="sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'"
      aria-hidden="true"
    ></div>

    <!-- Sidebar -->
    <div
      id="sidebar"
      ref="sidebar"
      class="no-scrollbar sidebar-expanded:overflow-hidden lg:sidebar-expanded:!w-64 z-60 absolute left-0 top-0 flex h-[100dvh] w-64 shrink-0 flex-col overflow-y-scroll bg-gradient-to-t from-blue-700 to-blue-700 transition-all duration-200 ease-in-out lg:static lg:left-auto lg:top-auto lg:w-20 lg:translate-x-0 lg:overflow-y-auto 2xl:!w-64"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-64'"
    >
      <!-- Sidebar header -->
      <div
        class="flex items-center justify-between bg-gradient-to-tr from-blue-700 via-blue-700 to-sky-400 p-2 sm:px-4"
      >
        <!-- Close button -->
        <Button
          ref="trigger"
          size="icon"
          class="text-slate-300 hover:text-slate-100 lg:hidden"
          @click.stop="$emit('close-sidebar')"
          aria-controls="sidebar"
          :aria-expanded="sidebarOpen"
        >
          <span class="sr-only">Close sidebar</span>
          <svg
            class="h-6 w-6 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z"
            />
          </svg>
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
          <h3
            v-if="group.label"
            class="pl-3 text-xs uppercase tracking-wider text-slate-400"
          >
            <span
              class="lg:sidebar-expanded:hidden hidden w-6 text-center lg:block 2xl:hidden"
              aria-hidden="true"
              >•••</span
            >
            <span class="lg:sidebar-expanded:block lg:hidden 2xl:block">{{
              group.label
            }}</span>
          </h3>
          <ul class="mt-2">
            <NuxtLink
              v-for="(linkItem, index) in group.menus"
              :to="generateLinkTo(linkItem)"
              custom
              v-slot="{ href, navigate, isExactActive }"
              :key="index"
            >
              <li class="mb-0.5 last:mb-0">
                <a
                  class="flex items-center truncate rounded-md text-slate-200 transition"
                  :class="
                    isExactActive
                      ? 'bg-blue-950 hover:bg-blue-950 hover:text-slate-200'
                      : 'hover:bg-blue-900/60 hover:text-white'
                  "
                  :href="href"
                  @click="navigate"
                >
                  <MenuIcon
                    v-if="linkItem.icon"
                    :name="linkItem.icon"
                    class="h-7 w-7 fill-current shrink-0 p-2.5 box-content"
                  />
                  <span
                    class="lg:sidebar-expanded:opacity-100 text-sm font-medium lg:opacity-0 2xl:opacity-100"
                    >{{ linkItem.name }}</span
                  >
                </a>
              </li>
            </NuxtLink>
          </ul>
        </div>
      </div>
      <div v-else>Error loading menu items</div>

      <!-- Expand / collapse button -->
      <div class="mt-auto hidden justify-end lg:inline-flex p-4">
        <Button
          @click="toggleSidebar"
          variant="ghost"
          size="icon"
          class="text-slate-200"
        >
          <span class="sr-only">Expand / collapse sidebar</span>
          <Icon
            icon="radix-icons:pin-right"
            class="h-6 w-6"
            :class="sidebarExpanded ? 'transform rotate-180' : ''"
          />
        </Button>
      </div>
    </div>
  </div>
</template>
