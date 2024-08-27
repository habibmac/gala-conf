// useMenu.ts
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from "@/stores";
import { useEvent } from '@/composables/useEvent';
import { menuGroups } from '@/config/menuGroups';
import type { MenuGroup, MenuItem } from '~/types/menu';

export const useMenu = () => {
    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore();
    const { event } = useEvent();

    const allMenuItems = ref<MenuItem[]>([]);
    const isLoading = ref(false);

    const loadMenuItems = () => {
        isLoading.value = true;
        const routes = router.getRoutes();
        allMenuItems.value = processRoutes(routes);
        isLoading.value = false;
    };

    const processRoutes = (routes: any[]): MenuItem[] => {
        let items: MenuItem[] = [];
        routes.forEach((route) => {
            const meta = route.meta || {};
            if (meta.showInMenu) {
                const routeRoles = meta.roles as string[] | undefined;
                const routePackages = meta.packages as string[] | undefined;
                const routeCapabilities = meta.capabilities as string[] | undefined;
                const routePermissions = meta.permissions as string[] | undefined;

                const hasAccess = authStore.hasAccess(routeRoles, routePackages);
                const hasCapabilitiesAndPermissions = authStore.canAccessRoute(
                    routeCapabilities || [],
                    routePermissions || []
                );

                if (hasAccess && hasCapabilitiesAndPermissions) {
                    items.push({
                        name: meta.title as string,
                        to: route.path as string,
                        roles: routeRoles,
                        packages: routePackages,
                        capabilities: routeCapabilities,
                        permissions: routePermissions,
                        group: meta.group as string || '',
                        icon: meta.icon as string | undefined,
                        order: meta.order as number | undefined,
                    });
                }
            }
            if (route.children && route.children.length > 0) {
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
            const groupIndex = groupedItems.findIndex(
                (group) => group.id === item.group
            );
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
    watch([
        () => authStore.selectedEvent,
    ], () => {
        loadMenuItems();
    }, { immediate: true });

    return {
        menuItems,
        isLoading,
        loadMenuItems
    };
};