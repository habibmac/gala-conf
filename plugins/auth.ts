// plugins/auth.ts
export default defineNuxtPlugin(async (nuxtApp) => {
    // Only run on client-side
    if (import.meta.server) {
        return;
    }

    const authStore = useAuthStore();

    // Add try-catch for safer initialization
    try {
        if (authStore.accessToken && authStore.refreshToken) {
            authStore.setAuth(authStore.accessToken, authStore.refreshToken);
        }
    } catch (error) {
        console.error('Error initializing auth:', error);
        authStore.clearAuth();
    }
});