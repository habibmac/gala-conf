import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { type PaginationState, type SortingState } from '@tanstack/vue-table';
import type { RegRequestParams } from '@/types';

const DEFAULT_PAGE_COUNT = -1;
const DEFAULT_RESULT_COUNT = 0;

type FilterValue = string | string[];

type Filter = {
  [key: string]: FilterValue;
};

export const useRegs = (
  eventId: Ref<string>,
  endpoint: string,
  pagination: Ref<PaginationState>,
  sorting: Ref<SortingState>,
  filters: Ref<Filter>
) => {
  const nuxtApp = useNuxtApp();

  const requestParams = computed<RegRequestParams>(() => ({
    per_page: pagination.value.pageSize.toString(),
    page: (pagination.value.pageIndex + 1).toString(),
    sort_by: sorting.value.length > 0 ? sorting.value[0].id : '',
    order: sorting.value.length > 0 && sorting.value[0].desc ? 'desc' : 'asc',
    ...filters.value,
  }));

  const getData = async (requestParams: Ref<RegRequestParams>, signal: AbortSignal) => {
    // Create url params
    const searchParams = new URLSearchParams();
    Object.entries(requestParams.value).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          // Join array values with commas
          searchParams.append(key, value.join(','));
        } else {
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

  const { data, error, isLoading } = useQuery({
    queryKey: [endpoint, requestParams, eventId],
    queryFn: ({ signal }) => getData(requestParams, signal),
    // staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const totalData = computed(() => data.value?.pagination.total_data || DEFAULT_RESULT_COUNT);
  const totalPages = computed(() => data.value?.pagination.total_pages || DEFAULT_PAGE_COUNT);

  const regData = computed(() => data.value?.events);

  return {
    regData,
    totalData,
    totalPages,
    error,
    isLoading,
  };
};
