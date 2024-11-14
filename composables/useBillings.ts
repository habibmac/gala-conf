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

  // Create computed request params to track all parameter changes
  const requestParams = computed(() => ({
    per_page: pagination.value.pageSize.toString(),
    // Always send 1-based page numbers to the API
    page: String(pagination.value.pageIndex + 1),
    sort_by: sorting.value.length > 0 ? sorting.value[0].id : '',
    order: sorting.value.length > 0 && sorting.value[0].desc ? 'desc' : 'asc',
    ...filters.value,
  }));

  const getData = async (signal: AbortSignal) => {
    // Create url params
    const searchParams = new URLSearchParams();
    Object.entries(requestParams.value).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        // Convert to string to ensure it's not undefined
        searchParams.append(key, String(value));
      }
    });

    return $galantisApi
      .get(`/event/${eventId.value}/billings?${searchParams.toString()}`, {
        signal,
      })
      .then((response) => {
        return {
          data: response.data.data,
          pagination: response.data.pagination,
          summary: response.data.summary,
        };
      })
      .catch((error) => {
        throw new Error(error);
      });
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ['billings', requestParams, eventId],
    queryFn: ({ signal }) => getData(signal),
    // Optional: Add stale time if needed
    // staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    billingData: computed(() => data.value?.data || []),
    totalData: computed(() => data.value?.pagination.total_data || 0),
    totalPages: computed(() => data.value?.pagination.total_pages || 1),
    summary: computed(() => data.value?.summary || null),
    isLoading,
    error,
  };
};