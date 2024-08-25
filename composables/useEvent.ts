import { ref, watch, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores';

export const useEvent = () => {
    const route = useRoute();
    const authStore = useAuthStore();

    const eventId = ref(route.params.eventId as string) || ref('');

    const getData = async (eventId: Ref<string>, signal: AbortSignal) => {
        return useNuxtApp().$galantisApi
            .get(`/event/${eventId.value}`, {
                signal,
            })
            .then((response) => {
                // Update the selected event in the store
                authStore.setSelectedEvent(response.data);
                return response.data;
            })
            .catch((error) => {
                throw new Error(error);
            });
    };

    const {
        isLoading,
        isError,
        error,
        data: event,
        refetch,
    } = useQuery({
        queryKey: ['event', eventId],
        queryFn: ({ signal }) => getData(eventId, signal),
        enabled: !!eventId,
        staleTime: 1000 * 60 * 5, // 5 minutes
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
        isLoading,
        isError,
        error,
        event,
    };
};
