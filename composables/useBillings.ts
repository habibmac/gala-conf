// composables/useBillings.ts
import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { PaginationState, SortingState } from '@tanstack/vue-table';
import type { BillingFilters } from '@/types';

export const useBillings = (
    eventId: Ref<string>,
    pagination: Ref<PaginationState>,
    sorting: Ref<SortingState>,
    filters: Ref<BillingFilters>
) => {
    const { $galantisApi } = useNuxtApp();

    const getData = async (signal: AbortSignal) => {
        const params = new URLSearchParams({
            page: (pagination.value.pageIndex + 1).toString(),
            per_page: pagination.value.pageSize.toString(),
            ...filters.value,
        });

        if (sorting.value.length > 0) {
            params.append('sort_by', sorting.value[0].id);
            params.append('order', sorting.value[0].desc ? 'desc' : 'asc');
        }

        const response = await $galantisApi.get(
            `/event/${eventId.value}/billings?${params.toString()}`,
            { signal }
        );

        return response.data;
    };

    const {
        data,
        isLoading,
        error
    } = useQuery({
        queryKey: ['billings', eventId, pagination, sorting, filters],
        queryFn: ({ signal }) => getData(signal),
        enabled: !!eventId.value,
    });

    console.log(data.value);

    return {
        billingData: computed(() => data.value?.data || []),
        totalData: computed(() => data.value?.pagination?.total_data || 0),
        totalPages: computed(() => data.value?.pagination?.total_pages || 1),
        summary: computed(() => data.value?.summary || null),
        isLoading,
        error,
    };
};