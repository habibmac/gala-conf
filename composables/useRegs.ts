import type { PaginationState, SortingState } from '@tanstack/vue-table';
import type { Ref } from 'vue';

import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { RegRequestParams } from '@/types';

const DEFAULT_PAGE_COUNT = -1;
const DEFAULT_RESULT_COUNT = 0;

type FilterValue = string | string[];

interface Filter {
  [key: string]: FilterValue
}

export const useRegs = (
  eventId: Ref<string>,
  endpoint: string,
  pagination: Ref<PaginationState>,
  sorting: Ref<SortingState>,
  filters: Ref<Filter>,
) => {
  const nuxtApp = useNuxtApp();

  // Map frontend column keys to API sort fields
  const mapSortField = (columnKey: string): string => {
    const sortFieldMap: Record<string, string> = {
      'fullname': 'name',
      'ticket_name': 'ticket',
      'date': 'date',
      'email': 'email',
      'status': 'status',
    };
    return sortFieldMap[columnKey] || 'date';
  };

  const requestParams = computed<RegRequestParams>(() => ({
    order: sorting.value.length > 0 && sorting.value[0].desc ? 'desc' : 'asc',
    page: (pagination.value.pageIndex + 1).toString(),
    per_page: pagination.value.pageSize.toString(),
    sort_by: sorting.value.length > 0 ? mapSortField(sorting.value[0].id) : 'date',
    search: filters.value.search || '',
    status: Array.isArray(filters.value.status) && filters.value.status.length > 0 
      ? filters.value.status.join(',') 
      : '',
    ticket_name: Array.isArray(filters.value.ticket_name) && filters.value.ticket_name.length > 0 
      ? filters.value.ticket_name.join(',') 
      : '',
    date_start: filters.value.date_start || '',
    date_end: filters.value.date_end || '',
  }));

  const getData = async (requestParams: Ref<RegRequestParams>, signal: AbortSignal) => {
    // Create url params
    const searchParams = new URLSearchParams();
    Object.entries(requestParams.value).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          // Join array values with commas
          searchParams.append(key, value.join(','));
        }
        else {
          // Convert to string to ensure it's not undefined
          searchParams.append(key, String(value));
        }
      }
    });

    return nuxtApp.$galantisApi
      .get(`/event/${eventId.value}/${endpoint}?${searchParams.toString()}`, {
        signal,
      })
      .then((response) => {
        return {
          events: response.data.data,
          pagination: response.data.pagination,
        };
      })
      .catch((error) => {
        throw new Error(error);
      });
  };

  const { data, error, isLoading, refetch } = useQuery({
    queryFn: ({ signal }) => getData(requestParams, signal),
    queryKey: [endpoint, requestParams, eventId],
    // staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });

  const totalData = computed(() => data.value?.pagination.total_data || DEFAULT_RESULT_COUNT);
  const totalPages = computed(() => data.value?.pagination.total_pages || DEFAULT_PAGE_COUNT);

  const regData = computed(() => data.value?.events);

  return {
    error,
    isLoading,
    regData,
    totalData,
    totalPages,
    refetch,
  };
};
