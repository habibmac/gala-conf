import { defineStore } from 'pinia';

import type { AuthResponse, Event, UserProfile } from '@/types';

const accessTokenField = 'gala_at';
const refreshTokenField = 'gala_rt';

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig();
  const accessToken = useCookie(accessTokenField, {
    domain: config.public.nodeEnv === 'production' ? '.galanesia.com' : undefined,
    maxAge: 7200,
    path: '/',
    sameSite: 'lax',
    secure: true,
  });

  const refreshToken = useCookie(refreshTokenField, {
    domain: config.public.nodeEnv === 'production' ? '.galanesia.com' : undefined,
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: true,
  });

  const packages = ref<string[]>([]);
  const userInfo = ref<UserProfile | null>();

  const nuxtApp = useNuxtApp();

  const isLoadingUser = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value);
  const userCapabilities = ref<string[]>([]);

  const selectedEvent = ref<Event | null>(null); // Handle dropdown event selection
  const eventId = ref<string | null>(null); // Handle route event id
  const eventCapabilities = ref<string[]>([]);

  // Logout state
  const loggingOut = ref(false);

  const exchangeCodeForTokens = async (code: string) => {
    try {
      const response: AuthResponse = await $fetch<AuthResponse>('/api/exchange-token', {
        body: { code },
        method: 'POST',
      });
      // Set the tokens in the store
      setAuth(response.access_token, response.refresh_token);
    }
    catch (error) {
      console.error('Error exchanging code for tokens', error);
      throw error;
    }
  };

  const setAuth = (atToken: string, rtToken: string) => {
    accessToken.value = atToken;
    refreshToken.value = rtToken;

    nuxtApp.$galantisApi.defaults.headers.common.Authorization = `Bearer ${atToken}`;
  };

  const clearAuth = () => {
    accessToken.value = null;
    refreshToken.value = null;
    userInfo.value = null;
    packages.value = [];
  };

  const refreshingTokens = async () => {
    try {
      const response: AuthResponse = await $fetch<AuthResponse>('/api/refresh-token', {
        body: { refresh_token: refreshToken.value },
        method: 'POST',
      });
      setAuth(response.access_token, response.refresh_token);
      return response.access_token;
    }
    catch (error) {
      clearAuth();
      throw error;
    }
  };

  const fetchUserProfile = async () => {
    if (!isAuthenticated.value)
      return null;

    isLoadingUser.value = true;
    try {
      // Use the proxied endpoint instead
      const response: UserProfile = await $fetch<UserProfile>('/api/me', {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      });
      setUser(response);
      return response;
    }
    catch (error) {
      console.error('Error fetching user profile:', error);
      clearAuth();
      throw error;
    }
    finally {
      isLoadingUser.value = false;
    }
  };

  const setUser = (user: UserProfile) => {
    userInfo.value = user;
    userCapabilities.value = Object.keys(user?.capabilities || []);
  };

  const isLoadingEvent = ref(false);

  const setSelectedEvent = async (event: Event) => {
    isLoadingEvent.value = true;

    try {
      selectedEvent.value = event;
      eventId.value = event.id;
      eventCapabilities.value = event.capabilities || [];
    }
    finally {
      isLoadingEvent.value = false;
    }
  };

  const hasCapability = (capability: string) => {
    return userCapabilities.value.includes(capability);
  };

  const hasEventPermission = (permission: string) => {
    // Check user global capabilities first (from WP roles)
    if (hasCapability(permission)) {
      return true;
    }

    // Check event-specific capabilities based on package
    if (selectedEvent.value?.capabilities?.includes(permission)) {
      return true;
    }

    return false;
  };

  const canAccessRoute = (requiredCapabilities: string[], requiredPermissions: string[]) => {
    // First check roles
    const hasRole = userInfo.value?.user_roles?.some(role =>
      ['administrator', 'ee_event_operator', 'ee_event_organizer'].includes(role),
    );

    if (!hasRole)
      return false;

    // Check all required capabilities and permissions
    const allPermissions = [...new Set([...requiredCapabilities, ...requiredPermissions])];
    return allPermissions.every(perm => hasEventPermission(perm));
  };

  const hasAccess = (roles?: string[], pkgs?: string[]) => {
    if (!roles && !pkgs)
      return true;
    if (roles && roles.some(role => userInfo.value?.user_roles?.includes(role)))
      return true;
    if (pkgs && pkgs.some(pkg => packages.value.includes(pkg)))
      return true;
    return false;
  };

  const logout = async () => {
    loggingOut.value = true;
    try {
      await nuxtApp.$oauthApi.post('/destroy/', {
        access_token: accessToken.value,
      });
    }
    catch (error) {
      console.error('Error during logout', error);
    }
    finally {
      clearAuth();
      loggingOut.value = false;
    }
  };

  return {
    accessToken,
    canAccessRoute,
    clearAuth,
    eventCapabilities,
    exchangeCodeForTokens,
    fetchUserProfile,
    hasAccess,
    hasCapability,
    hasEventPermission,
    isAuthenticated,
    isLoadingEvent,
    isLoadingUser,
    loggingOut,
    logout,
    packages,
    refreshingTokens,
    refreshToken,
    selectedEvent,
    setAuth,
    setSelectedEvent,
    setUser,
    userCapabilities,
    userInfo,
  };
});
