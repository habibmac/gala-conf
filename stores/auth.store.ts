import { defineStore } from "pinia";
import type { AuthResponse, UserProfile, Event } from "@/types";

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
    const userCapabilities = ref<string[]>([]);

    const selectedEvent = ref<Event | null>(null); // Handle dropdown event selection
    const eventId = ref<string | null>(null); // Handle route event id
    const eventCapabilities = ref<string[]>([]);

    // Logout state
    const loggingOut = ref(false);

    const exchangeCodeForTokens = async (code: string) => {
        try {
            const response: AuthResponse = await $fetch('/api/exchange-token', {
                method: 'POST',
                body: { code },
            })
            // Set the tokens in the store
            setAuth(response.access_token, response.refresh_token);

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
            const response: AuthResponse = await $fetch('/api/refresh-token', {
                method: 'POST',
                body: { refresh_token: refreshToken.value },
            });
            setAuth(response.access_token, response.refresh_token);
            return response.access_token;
        } catch (error) {
            clearAuth();
            throw error;
        }
    };

    const setUser = (user: UserProfile) => {
        userInfo.value = user;
        userCapabilities.value = Object.keys(user?.capabilities || []);
    };

    const setSelectedEvent = async (event: Event) => {
        selectedEvent.value = event
        eventId.value = event.id
        eventCapabilities.value = event.capabilities || []
    }

    const hasCapability = (capability: string) => {
        return userCapabilities.value.includes(capability)
    }

    const hasEventPermission = (permission: string) => {
        return eventCapabilities.value.includes(permission)
    }

    const canAccessRoute = (requiredCapabilities: string[], requiredPermissions: string[]) => {
        // If no capabilities or permissions are required, let the user through
        if (!requiredCapabilities.length && !requiredPermissions.length) return true

        // Check if the user has all the required capabilities
        const hasCapabilities = requiredCapabilities.every(cap => hasCapability(cap))

        // If no permissions are required, return the capabilities check only
        if (!requiredPermissions.length)
            return hasCapabilities

        const hasPermissions = requiredPermissions.every(perm => hasEventPermission(perm))

        return hasCapabilities && hasPermissions
    }

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
        hasAccess,
        userCapabilities,
        eventCapabilities,
        hasCapability,
        hasEventPermission,
        canAccessRoute,
        selectedEvent,
        setSelectedEvent,
        logout,
    };
});