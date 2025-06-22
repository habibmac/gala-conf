import { useQuery } from '@tanstack/vue-query';

import type { AgendaParams, AgendaResponse } from '@/types/agenda';

export function useAgenda(eventId: Ref<string>, params: Ref<AgendaParams> = ref({})) {
  const getEventAgenda = async (evtId: string, queryParams: AgendaParams): Promise<AgendaResponse> => {
    const { $galantisApi } = useNuxtApp();
    const response = await $galantisApi.get(`/event/${evtId}/agenda`, {
      params: queryParams,
    });
    return response.data;
  };

  const {
    data: agenda,
    isLoading: isAgendaLoading,
    isError: isAgendaError,
    error: agendaError,
    refetch: refetchAgenda,
  } = useQuery({
    enabled: !!eventId,
    queryFn: () => getEventAgenda(eventId.value, params.value),
    queryKey: ['eventAgenda', eventId, params],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    agenda,
    isAgendaLoading,
    isAgendaError,
    agendaError,
    refetchAgenda,
  };
}
