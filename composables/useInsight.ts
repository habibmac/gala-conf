import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { PaginationState, SortingState } from '@tanstack/vue-table';
import type { RegRequestParams } from '@/types';

interface InsightFilters {
  search?: string;
  date_start?: string;
  date_end?: string;
  group?: string;
  nocache?: string;
  [key: string]: string | string[] | undefined;
}

export const useInsight = (
  eventId: Ref<string>,
  insightId: string,
  pagination?: Ref<PaginationState>,
  sorting?: Ref<SortingState>,
  filters?: Ref<InsightFilters>
) => {
  const nuxtApp = useNuxtApp();

  // Default values
  const defaultPagination = ref<PaginationState>({
    pageSize: 10,
    pageIndex: 0,
  });

  const defaultSorting = ref<SortingState>([
    {
      id: 'date',
      desc: false,
    },
  ]);

  const defaultFilters = ref<InsightFilters>({
    search: '',
    date_start: '',
    date_end: '',
    group: '',
  });

  // 1. Metadata query - just get insight details
  const {
    data: metaData,
    error: metaError,
    isLoading: isMetaLoading,
  } = useQuery({
    queryKey: ['insight-meta', eventId, insightId],
    queryFn: ({ signal }) => getMetaData(signal),
    staleTime: 30000, // 30 seconds
  });

  // Use provided values or defaults
  const activePagination = pagination || defaultPagination;
  const activeSorting = sorting || defaultSorting;
  const activeFilters = filters || defaultFilters;

  // 2. Registration data query - handles all filters, pagination, sorting
  const requestParams = computed<RegRequestParams>(() => ({
    per_page: activePagination.value.pageSize.toString(),
    page: (activePagination.value.pageIndex + 1).toString(),
    sort_by: activeSorting.value.length > 0 ? activeSorting.value[0].id : 'date',
    order: activeSorting.value.length > 0 && activeSorting.value[0].desc ? 'desc' : 'asc',
    search: activeFilters.value.search || '',
    date_start: activeFilters.value.date_start || '',
    date_end: activeFilters.value.date_end || '',
    ...activeFilters.value, // Include any additional filters
  }));

  const {
    data: regData,
    error: dataError,
    isLoading: isDataLoading,
  } = useQuery({
    queryKey: ['insight-data', requestParams, eventId, insightId],
    queryFn: ({ signal }) => getRegData(requestParams, signal),
    staleTime: 30000, // 30 seconds
  });

  // API calls
  const getMetaData = async (signal: AbortSignal) => {
    return nuxtApp.$galantisApi.get(`/event/${eventId.value}/insight/${insightId}`, { signal }).then((response) => ({
      id: response.data.data.id,
      title: response.data.data.title,
      created_at: response.data.data.created_at,
      last_modified: response.data.data.last_modified,
      author: response.data.data.author,
      avatar: response.data.data.avatar,
      is_public: response.data.data.is_public,
      event_id: response.data.data.event_id,
      fields: response.data.data.fields,
      groups: response.data.data.groups,
    }));
  };

  const getRegData = async (requestParams: Ref<RegRequestParams>, signal: AbortSignal) => {
    const searchParams = new URLSearchParams();
    Object.entries(requestParams.value).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return nuxtApp.$galantisApi
      .get(`/event/${eventId.value}/insight/${insightId}/data?${searchParams.toString()}`, { signal })
      .then((response) => ({
        registrations: response.data.data,
        pagination: response.data.pagination,
      }));
  };

  // 3. Export function - separate from queries, called on demand
  const fetchAllData = async () => {
    const searchParams = new URLSearchParams();
    Object.entries(activeFilters.value).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
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
    insightData: computed(() => metaData.value),
    ticketGroups: computed(() => metaData.value?.groups),
    regData: computed(() => regData.value?.registrations),
    fetchAllData,
    totalData: computed(() => regData.value?.pagination.total_data || 0),
    totalPages: computed(() => regData.value?.pagination.total_pages || -1),
    isMetaLoading,
    isDataLoading,
    metaError,
    dataError,
  };
};
