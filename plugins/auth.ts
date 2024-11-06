// plugins/auth.ts
export default defineNuxtPlugin(async () => {
    const authStore = useAuthStore();

    // Initialize auth state from cookies if they exist
    const accessToken = useCookie('gala_at');
    const refreshToken = useCookie('gala_rt');

    if (accessToken.value && refreshToken.value) {
        authStore.setAuth(accessToken.value, refreshToken.value);
    }
});