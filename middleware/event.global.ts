// middleware/event.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
    const authStore = useAuthStore();

    // Ensure user profile is loaded
    if (authStore.isAuthenticated && !authStore.userInfo) {
        await authStore.fetchUserProfile();
    }

    // Skip for non-event routes
    if (!to.meta.requiresSelectedEvent) {
        return;
    }

    // Get eventId from route params directly
    const eventId = to.params.eventId as string;

    if (!eventId) {
        return navigateTo('/my-events');
    }

    // Check if we need to load the event
    if (!authStore.selectedEvent || authStore.selectedEvent.id !== eventId) {
        try {
            const response = await useNuxtApp().$galantisApi.get(`/event/${eventId}`);
            await authStore.setSelectedEvent(response.data);
        } catch (error) {
            console.error('Error loading event:', error);
            return navigateTo('/my-events');
        }
    }

    // Now check permissions with loaded event
    if (authStore.selectedEvent) {
        // Check user roles
        const routeRoles = to.meta.roles as string[] | undefined;
        const hasRole = !routeRoles?.length ||
            routeRoles.some(role => authStore.userInfo?.user_roles?.includes(role));

        // Check event package
        const routePackages = to.meta.packages as string[] | undefined;
        const hasPackage = !routePackages?.length ||
            routePackages.includes(authStore.selectedEvent.package);

        // Check capabilities
        const routeCapabilities = to.meta.capabilities as string[] | undefined;
        const hasCapabilities = !routeCapabilities?.length ||
            routeCapabilities.every(cap => authStore.hasEventPermission(cap));

        if (!hasRole || !hasPackage || !hasCapabilities) {
            return navigateTo('/my-events');
        }
    } else {
        console.error('No event loaded');
        return navigateTo('/my-events');
    }
});