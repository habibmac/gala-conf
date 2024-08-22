export default defineNuxtRouteMiddleware((to) => {
    const authStore = useAuthStore()

    // Handle the /authorize route
    if (to.path === '/authorize') {
        return;
    }

    // Protect routes that require authentication
    if (!authStore.isAuthenticated && !['/', '/auth/login'].includes(to.path)) {
        return navigateTo('/auth/login')
    }

    // Redirect authenticated users away from login page
    if (authStore.isAuthenticated && to.path === '/auth/login') {
        return navigateTo('/my-events')
    }
})