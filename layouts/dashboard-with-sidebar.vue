<script setup lang="ts">
import { ref } from "vue";

const isSidebarExpanded = ref(false);

const setSidebarExpanded = (value: boolean) => {
  isSidebarExpanded.value = value;
};
</script>
<template>
  <Sidebar
    :sidebar-open="isSidebarExpanded"
    @close-sidebar="setSidebarExpanded(false)"
  />
  <div
    class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-slate-200 dark:bg-slate-900"
  >
    <NavBar />

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
