// composables/useVenue.ts
import { type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { VenueData } from '@/types/venue';

export const useVenue = (eventId: Ref<string>) => {
    const nuxtApp = useNuxtApp();

    const {
        data: venueData,
        error: venueError,
        isLoading: isVenueLoading,
    } = useQuery({
        queryKey: ['venue-data', eventId],
        queryFn: ({ signal }) =>
            nuxtApp.$galantisApi
                .get(`/event/${eventId.value}/venue/dashboard`, {
                    signal,
                })
                .then((response) => response.data as VenueData),
        enabled: !!eventId.value, // Only run query if we have a non-empty eventId
    });

    return {
        venueData,
        venueError,
        isVenueLoading,
    };
};