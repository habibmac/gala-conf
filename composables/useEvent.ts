import type { Ref } from 'vue';

import { useQuery } from '@tanstack/vue-query';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useAuthStore } from '@/stores';

export const useEvent = (initialEventId?: string) => {
  const route = useRoute();
  const authStore = useAuthStore();
  const eventId = ref(initialEventId || (route.params.eventId as string) || '');

  const getData = async (eventId: Ref<string>, signal: AbortSignal) => {
    if (!eventId.value)
      return null;

    // Check if event is already loaded in store
    if (authStore.selectedEvent?.id === eventId.value) {
      return authStore.selectedEvent;
    }

    try {
      const response = await useNuxtApp().$galantisApi.get(`/event/${eventId.value}`, {
        signal,
      });
      await authStore.setSelectedEvent(response.data);
      return response.data;
    }
    catch (error) {
      console.error('Error fetching event:', error);
      throw new Error('Error fetching event');
    }
  };

  const {
    data: event,
    error,
    isError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    enabled: !!eventId.value,
    queryFn: ({ signal }) => getData(eventId, signal),
    queryKey: ['event', eventId],
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Since middleware pre-loads, this should usually return cached data
    initialData: () => authStore.selectedEvent?.id === eventId.value ? authStore.selectedEvent : undefined,
  });

  watch(
    () => route.params.eventId,
    (newEventId) => {
      if (newEventId && newEventId !== eventId.value) {
        eventId.value = newEventId as string;
        refetch();
      }
    },
  );

  return {
    error,
    event,
    eventId,
    isError,
    isLoading,
    isRefetching,
    refetch,
  };
};
