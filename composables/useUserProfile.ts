import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import type { UserProfile } from '@/types';

export const useUserProfile = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  const user = ref<UserProfile | null>(null);
  const isLoading = ref<boolean>(false);
  const isError = ref<boolean>(false);
  const error = ref<unknown>(null);

  const getUserProfile = async () => {
    const { $oauthApi } = useNuxtApp();

    const response = await $oauthApi.get('/me/', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    // Update the user store with the latest user data
    authStore.setUser(response.data);
    return response.data as UserProfile;
  };

  const fetchUserProfile = async () => {
    if (!authStore.isAuthenticated) {
      // Redirect to login if the user is not authenticated
      router.replace({ name: 'Login' });
    }

    isLoading.value = true;
    isError.value = false;
    error.value = null;

    try {
      const userData = await queryClient.fetchQuery<UserProfile>({
        queryKey: ['user'],
        queryFn: getUserProfile,
      });
      user.value = userData;
    } catch (err) {
      isError.value = true;
      error.value = err;

      // Clear the auth store if the user is not authenticated
      authStore.clearAuth();
    } finally {
      isLoading.value = false;
    }
  };

  fetchUserProfile();

  return {
    user,
    isLoading,
    isError,
    error,
  };
};
