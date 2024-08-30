import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';

export const useInsight = (
    eventId: Ref<string>,
    endpoint: string,
) => {

    const nuxtApp = useNuxtApp();

    const getData = async (
        signal: AbortSignal,
    ) => {
        return nuxtApp.$galantisApi
            .get(
                `/event/${eventId.value}/${endpoint}`,
                {
                    signal,
                },
            )
            .then((response) => {
                // Assuming the API response structure includes both 'data' and 'pagination'
                return response.data
            })
            .catch((error) => {
                throw new Error(error);
            });
    };

    const { data, error, isLoading } = useQuery({
        queryKey: [endpoint, eventId],
        queryFn: ({ signal }) => getData(signal),
        // staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const insightData = computed(() => data.value?.data);

    const ticketGroups = computed(() => data.value?.data?.groups);

    return {
        insightData,
        ticketGroups,
        error,
        isLoading,
    };
};
