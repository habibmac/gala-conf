<script setup lang="ts">
import { Icon } from '@iconify/vue';

const route = useRoute();

const subMenuItems = computed(() => {
  const currentRoute = route.matched[route.matched.length - 1];
  const parentPath = currentRoute?.meta?.parentPath as string;

  if (!parentPath)
    return [];

  const router = useRouter();
  const allRoutes = router.getRoutes();

  return allRoutes
    .filter((r) => {
      const meta = r.meta || {};
      return meta.isSubMenu
        && meta.parentPath === parentPath
        && meta.showInMenu;
    })
    .map(r => ({
      title: r.meta?.title as string,
      // ✅ Fix: Replace both :eventId and :eventId()
      path: r.path
        .replace(':eventId()', route.params.eventId as string)
        .replace(':eventId', route.params.eventId as string),
      icon: r.meta?.icon as string,
      order: r.meta?.order as number || 999,
    }))
    .sort((a, b) => a.order - b.order);
});

const isActiveSubmenu = (path: string) => route.path === path;
</script>

<template>
  <aside
    v-if="subMenuItems.length > 0"
    class="absolute inset-y-0 z-20 -mr-px hidden w-full translate-x-0 transition-transform duration-200 ease-in-out md:static md:inset-y-auto md:block md:w-auto md:translate-x-0"
  >
    <div
      class="no-scrollbar sticky top-16 h-[calc(100dvh-64px)] shrink-0 overflow-y-auto overflow-x-hidden md:w-52 xl:w-64 2xl:w-80"
    >
      <div class="flex h-full flex-col gap-4 p-4">
        <h2 class="text-lg font-semibold">
          Settings
        </h2>
        <nav class="space-y-1">
          <NuxtLink
            v-for="item in subMenuItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-card hover:text-card-foreground  dark:hover:bg-slate-900"
            :class="isActiveSubmenu(item.path)
              ? 'bg-card dark:bg-slate-900 text-card-foreground font-medium'
              : 'text-muted-foreground'"
          >
            <Icon v-if="item.icon" :icon="item.icon" class="size-4" />
            {{ item.title }}
          </NuxtLink>
        </nav>
      </div>
    </div>
  </aside>
</template>
