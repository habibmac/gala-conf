import { ref, watch, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores';

export const useEvent = (initialEventId?: string) => {
  const route = useRoute();
  const authStore = useAuthStore();

  const eventId = ref(initialEventId || route.params.eventId as string || '');

  const getData = async (eventId: Ref<string>, signal: AbortSignal) => {
    if (!eventId.value) return null;

    // If we already have the correct event loaded, return it
    if (authStore.selectedEvent?.id === eventId.value) {
      return authStore.selectedEvent;
    }

    try {
      const response = await useNuxtApp().$galantisApi.get(`/event/${eventId.value}`, {
        signal,
      });
      await authStore.setSelectedEvent(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw new Error('Error fetching event');
    }
  };

  const {
    isLoading,
    isRefetching,
    isError,
    error,
    data: event,
    refetch,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: ({ signal }) => getData(eventId, signal),
    enabled: !!eventId.value,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  watch(
    () => route.params.eventId,
    (newEventId) => {
      if (newEventId && newEventId !== eventId.value) {
        eventId.value = newEventId as string;
        refetch();
      }
    }
  );

  return {
    isLoading,
    isRefetching,
    isError,
    error,
    event,
    refetch,
    eventId,
  };
};
