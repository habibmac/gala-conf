import type { PaginationState, SortingState } from '@tanstack/vue-table';
import type { Ref } from 'vue';

import { useQuery } from '@tanstack/vue-query';
// composables/useCheckins.ts
import { computed } from 'vue';

import type { CheckinFilters } from '~/types';

export const useCheckins = (
  eventId: Ref<string>,
  pagination: Ref<PaginationState>,
  sorting: Ref<SortingState>,
  filters: Ref<CheckinFilters>,
) => {
  const nuxtApp = useNuxtApp();

  const requestParams = computed(() => ({
    order: sorting.value.length > 0 && sorting.value[0].desc ? 'desc' : 'asc',
    page: (pagination.value.pageIndex + 1).toString(),
    per_page: pagination.value.pageSize.toString(),
    sort_by: sorting.value.length > 0 ? sorting.value[0].id : 'check_time',
    search: filters.value.search || '',
    datetime_start: filters.value.datetime_start || '',
    datetime_end: filters.value.datetime_end || '',
    datetime_id: filters.value.datetime || '',
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
    queryFn: ({ signal }) => getData(signal),
    queryKey: ['checkins', requestParams, eventId],
  });

  return {
    checkinData: computed(() => data.value?.data || []),
    error,
    isLoading,
    totalData: computed(() => data.value?.pagination.total_data || 0),
    totalPages: computed(() => data.value?.pagination.total_pages || 1),
  };
};
