// stores/ui.store.ts
import { defineStore } from 'pinia';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { UserPreferences, PreferencesResponse } from '~/types/preferences';

export const useUIStore = defineStore('ui', () => {
    const queryClient = useQueryClient();
    const { $galantisApi } = useNuxtApp();
    const colorMode = useColorMode();

    // Local state with default values
    const preferences = ref<UserPreferences>({
        sidebarExpanded: false,
        theme: 'system',
        locale: 'en',
        itemsPerPage: 10
    });

    // Query for fetching preferences
    const { data, isLoading } = useQuery({
        queryKey: ['user-preferences'],
        queryFn: async () => {
            const response = await $galantisApi.get<PreferencesResponse>('/user/preferences');
            return response.data.data;
        },
    });

    // Watch for changes in the query data
    watch(
        () => data.value,
        (newData) => {
            if (newData) {
                preferences.value = newData;
                applyPreferences(newData);
            }
        },
        { immediate: true }
    );

    // Apply preferences to the application
    function applyPreferences(prefs: Partial<UserPreferences>) {
        if (prefs.theme !== undefined) {
            colorMode.preference = prefs.theme;
        }
        // Remove the class first, then add it if needed
        document.documentElement.classList.remove('sidebar-expanded');
        if (prefs.sidebarExpanded) {
            document.documentElement.classList.add('sidebar-expanded');
        }
    }

    // Update local state and UI immediately, then sync with backend
    // ui.store.ts
    const updatePreferencesOptimistic = async (newPrefs: Partial<UserPreferences>) => {
        const previousState = { ...preferences.value };

        // Immediately update local state
        preferences.value = { ...preferences.value, ...newPrefs };
        applyPreferences(newPrefs);

        // Add retry logic
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const response = await $galantisApi.post<PreferencesResponse>('/user/preferences', newPrefs);
                queryClient.setQueryData(['user-preferences'], response.data.data);
                return;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    // Only revert on final failure
                    preferences.value = previousState;
                    applyPreferences(previousState);
                    console.error('Failed to save preferences after multiple attempts:', error);
                    // Optionally show error notification to user
                } else {
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                }
            }
        }
    };

    // Convenience methods for common actions
    const toggleSidebar = () => {
        updatePreferencesOptimistic({
            sidebarExpanded: !preferences.value.sidebarExpanded
        });
    };

    const setSidebarExpanded = (expanded: boolean) => {
        if (preferences.value.sidebarExpanded !== expanded) {
            updatePreferencesOptimistic({ sidebarExpanded: expanded });
        }
    };

    const setTheme = (theme: 'dark' | 'light' | 'system') => {
        // Only update if the theme is different
        if (preferences.value.theme !== theme) {
            updatePreferencesOptimistic({ theme });
        }
    };

    const setItemsPerPage = (count: number) => {
        updatePreferencesOptimistic({ itemsPerPage: count });
    };

    return {
        preferences,
        isLoading,
        toggleSidebar,
        setSidebarExpanded,
        setTheme,
        setItemsPerPage,
        updatePreferences: updatePreferencesOptimistic
    };
});