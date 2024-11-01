import { computed, ref, type Ref } from 'vue';
import { useQuery, keepPreviousData } from '@tanstack/vue-query';
import { type EvtRequestParams } from '~/types';

export const useEvents = ({
  search = ref(''),
  evtStatus = ref('all'),
  page = ref(1),
  perPage = ref(10),
}: EvtRequestParams = {}) => {
  const { $galantisApi } = useNuxtApp();
  const getData = async (evtStatus: Ref<string>, page: Ref<number>, perPage: Ref<number>, signal: AbortSignal) => {
    return $galantisApi
      .get('/events', {
        params: {
          search: search.value,
          page: page.value,
          per_page: perPage.value,
          evt_status: evtStatus.value,
          nocache: 1,
        },
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

  const { isLoading, isError, error, data, isPlaceholderData, refetch, isRefetching } = useQuery({
    queryKey: ['my-events', page, perPage, evtStatus, search],
    queryFn: ({ signal }) => getData(evtStatus, page, perPage, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const events = computed(() => data?.value?.events);
  const pagination = computed(() => data?.value?.pagination);

  // Pagination
  const maxPage = computed(() => pagination.value?.total_pages);

  const setPage = (newPage: number) => {
    page.value = newPage;
  };

  const setPerPage = (newPerPage: number) => {
    perPage.value = newPerPage;
  };

  const setEvtStatus = (newEvtStatus: string) => {
    evtStatus.value = newEvtStatus;
  };

  const prevPage = () => {
    if (page.value > 1) {
      setPage(page.value - 1);
    }
  };

  const nextPage = () => {
    if (page.value < maxPage.value) {
      setPage(page.value + 1);
    }
  };

  return {
    isLoading,
    isError,
    error,
    events,
    isPlaceholderData,
    pagination,
    page,
    perPage,
    maxPage,
    isRefetching,
    prevPage,
    nextPage,
    setPage,
    setPerPage,
    setEvtStatus,
    refetch,
  };
};
