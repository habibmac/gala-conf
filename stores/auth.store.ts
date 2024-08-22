import { defineStore } from "pinia";
import type { UserProfile } from "@/types";

const accessTokenField = "gala_at";
const refreshTokenField = "gala_rt";

export const useAuthStore = defineStore("auth", () => {
    const accessToken = useCookie<string | null>(accessTokenField);
    const refreshToken = useCookie<string | null>(refreshTokenField);
    const packages = ref<string[]>([]);
    const userInfo = ref<UserProfile | null>();

    const config = useRuntimeConfig();
    const nuxtApp = useNuxtApp();

    const isAuthenticated = computed(() => !!accessToken.value);
    
    // Logout state
    const loggingOut = ref(false);

    const exchangeCodeForTokens = async (code: string) => {
        try {
            const response = await nuxtApp.$oauthApi.post('/token', {
                grant_type: 'authorization_code',
                client_id: config.public.oauthClientId,
                client_secret: config.public.oauthClientSecret,
                code: code,
                redirect_uri: config.public.oauthRedirectUri,
            });

            setAuth(response.data.access_token, response.data.refresh_token);
            await fetchUserInfo();
        } catch (error) {
            console.error('Error exchanging code for tokens', error);
            throw error;
        }
    };

    const setAuth = (atToken: string, rtToken: string) => {
        accessToken.value = atToken;
        refreshToken.value = rtToken;

        nuxtApp.$galantisApi.defaults.headers.common["Authorization"] = `Bearer ${atToken}`;

    };

    const clearAuth = () => {
        accessToken.value = null;
        refreshToken.value = null;
        userInfo.value = null;
        packages.value = [];
    };

    const refreshTokens = async () => {
        try {
            const response = await nuxtApp.$oauthApi.post("/token", {
                grant_type: "refresh_token",
                refresh_token: refreshToken.value,
                client_id: config.public.oauthClientId,
                client_secret: config.public.oauthClientSecret,
            });

            setAuth(response.data.access_token, response.data.refresh_token);
            return response.data.access_token;
        } catch (error) {
            clearAuth();
            throw error;
        }
    };

    const setUser = (user: UserProfile | null) => {
        userInfo.value = user;
    };

    const fetchUserInfo = async () => {
        try {
            const response = await nuxtApp.$galantisApi.post(
                "/me",
                {},
                {
                    baseURL: config.public.oauthUrl,
                }
            );
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user info", error);
        }
    };

    const hasAccess = (roles?: string[], pkgs?: string[]) => {
        if (!roles && !pkgs) return true;
        if (roles && roles.some((role) => userInfo.value?.user_roles?.includes(role))) return true;
        if (pkgs && pkgs.some((pkg) => packages.value.includes(pkg))) return true;
        return false;
    };

    const logout = async () => {
        loggingOut.value = true;
        try {
            await nuxtApp.$oauthApi.post("/destroy/", {
                token: accessToken.value,
            });
        } catch (error) {
            console.error("Error during logout", error);
        } finally {
            clearAuth();
            loggingOut.value = false;
        }
    };

    return {
        accessToken,
        refreshToken,
        userInfo,
        packages,
        isAuthenticated,
        loggingOut,
        exchangeCodeForTokens,
        setAuth,
        clearAuth,
        refreshTokens,
        setUser,
        fetchUserInfo,
        hasAccess,
        logout,
    };
});