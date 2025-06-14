import type { PaginationState, SortingState } from '@tanstack/vue-table';
import type { Ref } from 'vue';

import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { RegRequestParams } from '@/types';

interface InsightFilters {
  search?: string
  date_start?: string
  date_end?: string
  group?: string
  [key: string]: string | string[] | undefined
}

export const useInsight = (
  eventId: Ref<string>,
  insightId: string,
  pagination?: Ref<PaginationState>,
  sorting?: Ref<SortingState>,
  filters?: Ref<InsightFilters>,
) => {
  const nuxtApp = useNuxtApp();

  // Default values
  const defaultPagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const defaultSorting = ref<SortingState>([
    {
      desc: false,
      id: 'date',
    },
  ]);

  const defaultFilters = ref<InsightFilters>({
    date_end: '',
    date_start: '',
    group: '',
    search: '',
  });

  // 1. Metadata query - just get insight details
  const {
    data: metaData,
    error: metaError,
    isLoading: isMetaLoading,
  } = useQuery({
    queryFn: ({ signal }) => getMetaData(signal),
    queryKey: ['insight-meta', eventId, insightId],
    staleTime: 30000, // 30 seconds
  });

  // Use provided values or defaults
  const activePagination = pagination || defaultPagination;
  const activeSorting = sorting || defaultSorting;
  const activeFilters = filters || defaultFilters;

  // 2. Registration data query - handles all filters, pagination, sorting
  const requestParams = computed<RegRequestParams>(() => ({
    date_end: activeFilters.value.date_end || '',
    date_start: activeFilters.value.date_start || '',
    order: activeSorting.value.length > 0 && activeSorting.value[0].desc ? 'desc' : 'asc',
    page: (activePagination.value.pageIndex + 1).toString(),
    per_page: activePagination.value.pageSize.toString(),
    search: activeFilters.value.search || '',
    sort_by: activeSorting.value.length > 0 ? activeSorting.value[0].id : 'date',
    ...activeFilters.value, // Include any additional filters
  }));

  const {
    data: regData,
    error: dataError,
    isLoading: isDataLoading,
  } = useQuery({
    queryFn: ({ signal }) => getRegData(requestParams, signal),
    queryKey: ['insight-data', requestParams, eventId, insightId],
    staleTime: 30000, // 30 seconds
  });

  // API calls
  const getMetaData = async (signal: AbortSignal) => {
    return nuxtApp.$galantisApi.get(`/event/${eventId.value}/insight/${insightId}`, { signal }).then(response => ({
      author: response.data.data.author,
      avatar: response.data.data.avatar,
      created_at: response.data.data.created_at,
      event_id: response.data.data.event_id,
      fields: response.data.data.fields,
      groups: response.data.data.groups,
      id: response.data.data.id,
      is_public: response.data.data.is_public,
      last_modified: response.data.data.last_modified,
      title: response.data.data.title,
    }));
  };

  const getRegData = async (requestParams: Ref<RegRequestParams>, signal: AbortSignal) => {
    const searchParams = new URLSearchParams();
    Object.entries(requestParams.value).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        }
        else {
          searchParams.append(key, String(value));
        }
      }
    });

    return nuxtApp.$galantisApi
      .get(`/event/${eventId.value}/insight/${insightId}/data?${searchParams.toString()}`, { signal })
      .then(response => ({
        pagination: response.data.pagination,
        registrations: response.data.data,
      }));
  };

  // 3. Export function - separate from queries, called on demand
  const fetchAllData = async () => {
    const searchParams = new URLSearchParams();
    Object.entries(activeFilters.value).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        }
        else {
          searchParams.append(key, String(value));
        }
      }
    });

    return nuxtApp.$galantisApi
      .get(`/event/${eventId.value}/insight/${insightId}/export?${searchParams.toString()}`)
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        return response.data.data;
      });
  };

  return {
    dataError,
    fetchAllData,
    insightData: computed(() => metaData.value),
    isDataLoading,
    isMetaLoading,
    metaError,
    regData: computed(() => regData.value?.registrations),
    ticketGroups: computed(() => metaData.value?.groups),
    totalData: computed(() => regData.value?.pagination.total_data || 0),
    totalPages: computed(() => regData.value?.pagination.total_pages || -1),
  };
};
