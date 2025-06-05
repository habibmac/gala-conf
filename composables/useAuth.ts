// composables/useAuth.ts
export const useAuth = () => {
  const authStore = useAuthStore();
  const isModalOpen = ref(false);
  const unauthorizedReason = ref('');

  const checkAccess = (meta: any) => {
    if (!meta.requiresSelectedEvent)
      return true;

    const routeRoles = meta.roles as string[] | undefined;
    const routePackages = meta.packages as string[] | undefined;
    const routeCapabilities = meta.capabilities as string[] | undefined;

    const hasRole = routeRoles?.some(role => authStore.userInfo?.user_roles?.includes(role)) ?? true;

    const hasPackage = routePackages?.includes(authStore.selectedEvent?.package as string) ?? true;

    const hasCapabilities = routeCapabilities?.every(cap => authStore.hasEventPermission(cap)) ?? true;

    if (!hasRole) {
      unauthorizedReason.value = 'Insufficient role permissions';
      isModalOpen.value = true;
      return false;
    }

    if (!hasPackage) {
      unauthorizedReason.value = `This feature requires ${routePackages?.join(' or ')} package`;
      isModalOpen.value = true;
      return false;
    }

    if (!hasCapabilities) {
      unauthorizedReason.value = 'Insufficient feature permissions';
      isModalOpen.value = true;
      return false;
    }

    return true;
  };

  return {
    checkAccess,
    isModalOpen,
    unauthorizedReason,
  };
};
