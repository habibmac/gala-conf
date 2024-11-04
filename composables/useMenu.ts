import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores';
import { menuGroups } from '@/config/menuGroups';
import type { MenuGroup, MenuItem } from '~/types/menu';

export const useMenu = () => {
  const router = useRouter();
  const authStore = useAuthStore();

  const allMenuItems = ref<MenuItem[]>([]);
  const isLoading = ref(false);

  const loadMenuItems = () => {
    isLoading.value = true;
    const routes = router.getRoutes();
    allMenuItems.value = processRoutes(routes);
    isLoading.value = false;
  };

  const generateLinkTo = (linkItem: MenuItem) => {
    if (linkItem.to?.includes(':eventId')) {
      const eventId = authStore.selectedEvent?.id;
      if (!eventId) {
        return { path: '/my-events' };
      }
      return { path: linkItem.to.replace(':eventId()', eventId) };
    }
    return { path: linkItem.to };
  };

  const processRoutes = (routes: any[]): MenuItem[] => {
    let items: MenuItem[] = [];
    routes.forEach((route) => {
      const meta = route.meta || {};
      if (meta.showInMenu) {
        const routeRoles = meta.roles as string[] | undefined;
        const routePackages = meta.packages as string[] | undefined;
        const routeCapabilities = meta.capabilities as string[] | undefined;

        // Check if user has right role
        const hasRole = routeRoles?.some(role =>
          authStore.userInfo?.user_roles?.includes(role)
        ) ?? true;

        // Check if event has right package
        const hasPackage = routePackages?.includes(
          authStore.selectedEvent?.package ?? ''
        ) ?? true;

        // Check if user has required capabilities
        const hasCapabilities = !routeCapabilities?.length ||
          routeCapabilities.every(cap => authStore.hasEventPermission(cap));

        if (hasRole && hasPackage && hasCapabilities) {
          const menuItem: MenuItem = {
            name: meta.title as string,
            to: route.path as string,
            roles: routeRoles,
            packages: routePackages,
            capabilities: routeCapabilities,
            group: (meta.group as string) || '',
            icon: meta.icon as string | undefined,
            order: meta.order as number | undefined,
          };

          menuItem.generatedLink = generateLinkTo(menuItem);
          items.push(menuItem);
        }
      }
      if (route.children?.length > 0) {
        items = items.concat(processRoutes(route.children));
      }
    });
    return items;
  };

  const menuItems = computed(() => {
    const groupedItems: MenuGroup[] = menuGroups.map((group) => ({
      ...group,
      menus: [],
    }));

    allMenuItems.value.forEach((item) => {
      const groupIndex = groupedItems.findIndex((group) => group.id === item.group);
      if (groupIndex !== -1) {
        groupedItems[groupIndex].menus.push(item);
      }
    });

    groupedItems.forEach((group) => {
      group.menus.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return groupedItems.filter((group) => group.menus.length > 0);
  });

  // Watch for changes in authentication state or selected event
  watch(
    [() => authStore.selectedEvent],
    () => {
      loadMenuItems();
    },
    { immediate: true }
  );

  return {
    menuItems,
    isLoading,
    loadMenuItems,
  };
};
