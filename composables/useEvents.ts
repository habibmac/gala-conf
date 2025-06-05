import type { Ref } from 'vue';

import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

import type { EvtRequestParams } from '~/types';

export const useEvents = ({
  evtStatus = ref('all'),
  page = ref(1),
  perPage = ref(10),
  search = ref(''),
}: EvtRequestParams = {}) => {
  const { $galantisApi } = useNuxtApp();
  const getData = async (evtStatus: Ref<string>, page: Ref<number>, perPage: Ref<number>, signal: AbortSignal) => {
    return $galantisApi
      .get('/events', {
        params: {
          evt_status: evtStatus.value,
          page: page.value,
          per_page: perPage.value,
          search: search.value,
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

  const { data, error, isError, isLoading, isPlaceholderData, isRefetching, refetch } = useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getData(evtStatus, page, perPage, signal),
    queryKey: ['my-events', page, perPage, evtStatus, search],
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
    error,
    events,
    isError,
    isLoading,
    isPlaceholderData,
    isRefetching,
    maxPage,
    nextPage,
    page,
    pagination,
    perPage,
    prevPage,
    refetch,
    setEvtStatus,
    setPage,
    setPerPage,
  };
};
