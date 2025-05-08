// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  // Handle public routes
  if (to.path === '/authorize' || to.path === '/auth/logout') {
    return;
  }

  // Safe public routes that should always be accessible
  const publicRoutes = ['/', '/auth/login', '/auth/test'];

  // If we're on a public route, allow access
  if (publicRoutes.includes(to.path)) {
    return;
  }

  // For all other routes, check authentication
  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login');
  }

  // Redirect authenticated users away from login page
  if (authStore.isAuthenticated && to.path === '/auth/login') {
    return navigateTo('/my-events');
  }
});
