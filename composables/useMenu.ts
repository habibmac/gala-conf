import { computed } from 'vue';
import { menuGroups } from '@/config/menuGroups';
import { useAuthStore } from '@/stores/auth';

interface MenuItem {
    name: string;
    to: string;
    roles?: string[];
    group?: string;
    icon?: string;
}

interface MenuGroup {
    id: string;
    label: string;
    menus: MenuItem[];
}

export const useMenu = () => {
    const authStore = useAuthStore();
    const router = useRouter();

    const processRoutes = (routes: any[]): MenuItem[] => {
        let items: MenuItem[] = [];
        routes.forEach((route) => {
            const meta = route.meta || {};
            if (meta.showInMenu) {
                const routeRoles = meta.roles as string[] | undefined;
                const routePackages = meta.packages as string[] | undefined;
                const hasAccess = authStore.hasAccess(routeRoles, routePackages);
                if (hasAccess) {
                    const groupName = meta.group || '';
                    items.push({
                        name: meta.title as string,
                        to: route.path,
                        roles: meta.roles as string[] | undefined,
                        group: groupName as string,
                        icon: meta.icon as string | undefined,
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

        const routes = router.getRoutes();
        const allItems = processRoutes(routes);

        allItems.forEach((item) => {
            const groupIndex = groupedItems.findIndex(
                (group) => group.id === item.group
            );
            if (groupIndex !== -1) {
                groupedItems[groupIndex].menus.push(item);
            } else {
                console.warn(`No matching group for menu item: ${item.name}`);
            }
        });

        return groupedItems.filter((group) => group.menus.length > 0);
    });

    return { menuItems };
};