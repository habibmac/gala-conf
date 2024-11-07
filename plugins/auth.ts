// plugins/auth.ts
export default defineNuxtPlugin(async () => {
    const authStore = useAuthStore();
    if (authStore.accessToken && authStore.refreshToken) {
        authStore.setAuth(authStore.accessToken, authStore.refreshToken);
    }
});