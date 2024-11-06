import { useAuthStore } from '@/stores';

export const useUserProfile = () => {
  const authStore = useAuthStore();

  // Only handle displaying user data, fetch is handled by auth store
  const user = computed(() => authStore.userInfo);
  const isLoading = computed(() => authStore.isLoadingUser);

  return {
    user,
    isLoading,
  };
};