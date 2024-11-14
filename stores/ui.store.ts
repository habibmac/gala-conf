// stores/ui.store.ts
import { defineStore } from 'pinia';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { useDebounceFn } from '@vueuse/core';
import type { UserPreferences, PreferencesResponse } from '~/types/preferences';

export const useUIStore = defineStore('ui', () => {
  const queryClient = useQueryClient();
  const { $galantisApi } = useNuxtApp();
  const colorMode = useColorMode();

  // Setup breakpoints
  const breakpoints = useBreakpoints(breakpointsTailwind);
  const isLargeScreen = breakpoints.greater('lg');

  // Local state
  const preferences = ref<UserPreferences>({
    sidebarExpanded: false,
    theme: 'system',
    locale: 'en',
    itemsPerPage: 10
  });

  // Mobile sidebar state
  const isSidebarOpenMobile = ref(false);
  const isUpdating = ref(false);

  // Query setup
  const query = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const response = await $galantisApi.get<PreferencesResponse>('/user/preferences');
      return response.data.data;
    },
  });

  const data = computed(() => query.data.value);
  const isLoading = computed(() => query.isLoading.value);

  watch(
    data,
    (newData) => {
      if (newData) {
        preferences.value = newData;
        applyPreferences(newData);
      }
    },
    { immediate: true }
  );

  function applyPreferences(prefs: Partial<UserPreferences>) {
    if (prefs.theme !== undefined) {
      colorMode.preference = prefs.theme;
    }

    if (prefs.sidebarExpanded !== undefined && isLargeScreen.value) {
      document.documentElement.classList.toggle('sidebar-expanded', prefs.sidebarExpanded);
    }
  }

  // Debounced API call function
  const savePreferencesToAPI = useDebounceFn(async (prefsToSave: Partial<UserPreferences>) => {
    if (isUpdating.value) return;

    try {
      isUpdating.value = true;
      const response = await $galantisApi.post<PreferencesResponse>(
        '/user/preferences',
        prefsToSave
      );
      queryClient.setQueryData(['user-preferences'], response.data.data);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    } finally {
      isUpdating.value = false;
    }
  }, 300); // 300ms debounce

  // Update preferences with debounce
  const updatePreferencesOptimistic = async (newPrefs: Partial<UserPreferences>) => {
    const previousState = { ...preferences.value };

    // Only update sidebar preference if on large screen
    const shouldUpdateSidebar = isLargeScreen.value && 'sidebarExpanded' in newPrefs;

    // Update local state immediately
    preferences.value = {
      ...preferences.value,
      ...newPrefs
    };

    // Apply changes immediately
    applyPreferences(newPrefs);

    // Prepare API preferences
    const prefsToSave = shouldUpdateSidebar ? newPrefs :
      'sidebarExpanded' in newPrefs ?
        { ...newPrefs, sidebarExpanded: previousState.sidebarExpanded } :
        newPrefs;

    try {
      // Use debounced API call
      await savePreferencesToAPI(prefsToSave);
    } catch (error) {
      // Revert on error
      preferences.value = previousState;
      applyPreferences(previousState);
    }
  };

  // Sidebar specific functions
  const toggleSidebar = () => {

    console.log('toggleSidebar called', {
      isLargeScreen: isLargeScreen.value,
      currentMobileState: isSidebarOpenMobile.value
    });

    if (isLargeScreen.value) {
      if (!isUpdating.value) {
        updatePreferencesOptimistic({
          sidebarExpanded: !preferences.value.sidebarExpanded
        });
      }
    } else {
      isSidebarOpenMobile.value = !isSidebarOpenMobile.value;
      console.log('after toggle mobile:', isSidebarOpenMobile.value);
    }
  };

  const setSidebarExpanded = (expanded: boolean) => {
    if (isLargeScreen.value) {
      if (preferences.value.sidebarExpanded !== expanded && !isUpdating.value) {
        updatePreferencesOptimistic({ sidebarExpanded: expanded });
      }
    } else {
      isSidebarOpenMobile.value = expanded;
    }
  };

  // Computed for current sidebar state
  const isSidebarOpen = computed(() => {
    return isLargeScreen.value ? preferences.value.sidebarExpanded : isSidebarOpenMobile.value;
  });

  // Other preference functions with update check
  const setTheme = (theme: 'dark' | 'light' | 'system') => {
    if (preferences.value.theme !== theme && !isUpdating.value) {
      updatePreferencesOptimistic({ theme });
    }
  };

  const setItemsPerPage = (count: number) => {
    if (!isUpdating.value) {
      updatePreferencesOptimistic({ itemsPerPage: count });
    }
  };

  return {
    preferences,
    isLoading,
    isUpdating,
    isSidebarOpen,
    toggleSidebar,
    setSidebarExpanded,
    setTheme,
    setItemsPerPage,
    updatePreferences: updatePreferencesOptimistic
  };
});