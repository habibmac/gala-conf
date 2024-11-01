import { computed, type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { type PaginationState, type SortingState } from '@tanstack/vue-table';
import type { RegRequestParams } from '@/types';

type FilterValue = string | string[];

type Filter = {
  [key: string]: FilterValue;
};

export const useInsight = (
  eventId: Ref<string>,
  insightId: string,
  pagination: Ref<PaginationState>,
  sorting: Ref<SortingState>,
  filters: Ref<Filter>
) => {
  const nuxtApp = useNuxtApp();

  // Compute request parameters
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
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return nuxtApp.$galantisApi
      .get(`/event/${eventId.value}/insight/${insightId}?${searchParams.toString()}`, {
        signal,
      })
      .then((response) => {
        return {
          insightMeta: {
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
          },
          registrations: response.data.data.data.data,
          pagination: response.data.data.data.pagination,
        };
      })
      .catch((error) => {
        throw new Error(error);
      });
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ['insight', requestParams, eventId, insightId],
    queryFn: ({ signal }) => getData(requestParams, signal),
  });

  const insightData = computed(() => data.value?.insightMeta);
  const regData = computed(() => data.value?.registrations);
  const ticketGroups = computed(() => data.value?.insightMeta.groups);
  const totalData = computed(() => data.value?.pagination.total_data || 0);
  const totalPages = computed(() => data.value?.pagination.total_pages || -1);

  return {
    insightData,
    regData,
    ticketGroups,
    totalData,
    totalPages,
    error,
    isLoading,
  };
};
