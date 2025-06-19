// composables/useAuth.ts
export const useAuth = () => {
  const authStore = useAuthStore();
  const router = useRouter();

  const isModalOpen = ref(false);
  const unauthorizedReason = ref('');

  const checkAccess = (routeMeta: any) => {
    // ✅ First check: If not authenticated, redirect instead of showing modal
    if (!authStore.isAuthenticated) {
      router.push('/auth/login');
      return false;
    }

    // ✅ Second check: If no user info, don't show modal yet
    if (!authStore.userInfo) {
      return false; // Let middleware handle this
    }

    const routeRoles = routeMeta?.roles;
    const routeCapabilities = routeMeta?.capabilities;
    const routePackages = routeMeta?.packages;

    const hasRole = routeRoles?.some((role: string) =>
      authStore.userInfo?.user_roles?.includes(role),
    ) ?? true;

    const hasPackage = routePackages?.includes(
      authStore.selectedEvent?.package as string,
    ) ?? true;

    const hasCapabilities = routeCapabilities?.every((cap: string) =>
      authStore.hasEventPermission(cap),
    ) ?? true;

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

  // ✅ Clear modal when user logs out
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (!isAuth) {
      isModalOpen.value = false;
      unauthorizedReason.value = '';
    }
  });

  return {
    checkAccess,
    isModalOpen,
    unauthorizedReason,
  };
};
