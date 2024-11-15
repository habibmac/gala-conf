// composables/useCheckins.ts
import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { PaginationState, SortingState } from '@tanstack/vue-table';
import type { CheckinFilters } from '~/types';

export const useCheckins = (
    eventId: Ref<string>,
    pagination: Ref<PaginationState>,
    sorting: Ref<SortingState>,
    filters: Ref<CheckinFilters>
) => {
    const nuxtApp = useNuxtApp();

    const requestParams = computed(() => ({
        per_page: pagination.value.pageSize.toString(),
        page: (pagination.value.pageIndex + 1).toString(),
        sort_by: sorting.value.length > 0 ? sorting.value[0].id : '',
        order: sorting.value.length > 0 && sorting.value[0].desc ? 'desc' : 'asc',
        ...filters.value,
    }));

    const getData = async (signal: AbortSignal) => {
        const searchParams = new URLSearchParams();
        Object.entries(requestParams.value).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                searchParams.append(key, String(value));
            }
        });

        return nuxtApp.$galantisApi
            .get(`/event/${eventId.value}/checkins/history?${searchParams.toString()}`, {
                signal,
            })
            .then((response) => {
                return {
                    data: response.data.data,
                    pagination: response.data.pagination,
                };
            });
    };

    const { data, error, isLoading } = useQuery({
        queryKey: ['checkins', requestParams, eventId],
        queryFn: ({ signal }) => getData(signal),
    });

    return {
        checkinData: computed(() => data.value?.data || []),
        totalData: computed(() => data.value?.pagination.total_data || 0),
        totalPages: computed(() => data.value?.pagination.total_pages || 1),
        isLoading,
        error,
    };
};