<script setup lang="ts">
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
  <aside v-if="subMenuItems.length > 0" class="w-64 overflow-y-auto border-r bg-background p-6">
    <div class="space-y-1">
      <h2 class="mb-4 text-lg font-semibold">
        Settings
      </h2>
      <nav class="space-y-1">
        <NuxtLink
          v-for="item in subMenuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-card hover:text-card-foreground"
          :class="isActiveSubmenu(item.path)
            ? 'bg-card text-card-foreground font-medium'
            : 'text-muted-foreground'"
        >
          <Icon v-if="item.icon" :icon="item.icon" class="size-4" />
          {{ item.title }}
        </NuxtLink>
      </nav>
    </div>
  </aside>
</template>
