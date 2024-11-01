export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  // Handle the /authorize route
  if (to.path === '/authorize') {
    return;
  }

  // Handle the /auth/logout route
  if (to.path === '/auth/logout') {
    return;
  }

  // Protect routes that require authentication
  if (!authStore.isAuthenticated && !['/', '/auth/login'].includes(to.path)) {
    return navigateTo('/auth/login');
  }

  // Redirect authenticated users away from login page
  if (authStore.isAuthenticated && to.path === '/auth/login') {
    return navigateTo('/my-events');
  }

  if (authStore.isAuthenticated && authStore.selectedEvent) {
    // Check if the current route or any of its parent routes requires a selected event
    const requiresSelectedEvent = to.matched.some((record) => record.meta.requiresSelectedEvent);

    if (requiresSelectedEvent && !authStore.selectedEvent) {
      return navigateTo('/my-events');
    }

    // Check if meta roles are defined
    const routeRoles = to.meta.roles as string[] | undefined;
    const routePackages = to.meta.packages as string[] | undefined;
    const routeCapabilities = to.meta.capabilities as string[] | undefined;
    const routePermissions = to.meta.permissions as string[] | undefined;

    const hasAccess = authStore.hasAccess(routeRoles, routePackages);
    const hasCapabilitiesAndPermissions = authStore.canAccessRoute(routeCapabilities || [], routePermissions || []);

    // Continue to the route if the user has access
    if (!hasAccess || !hasCapabilitiesAndPermissions) {
      return navigateTo('404');
    }
  }
});
