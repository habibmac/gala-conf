// composables/useStats.ts
import type { Ref } from 'vue';

import { useQuery } from '@tanstack/vue-query';

import type { AttendeeStats, CustomFieldStats, StatsFilters, TransactionStats } from '@/types/stats';

export const useStats = (eventId: Ref<string>, filters?: Ref<StatsFilters>) => {
  const nuxtApp = useNuxtApp();

  // Attendee Stats Query
  const {
    data: attendeeStats,
    error: attendeeError,
    isLoading: isAttendeeLoading,
  } = useQuery({
    enabled: !!eventId.value,
    queryFn: ({ signal }) =>
      nuxtApp.$galantisApi
        .get(`/event/${eventId.value}/stats/attendee`, {
          params: filters?.value,
          signal,
        })
        .then(response => response.data.data as AttendeeStats),
    queryKey: ['attendee-stats', eventId, filters],
  });

  // Transaction Stats Query
  const {
    data: transactionStats,
    error: transactionError,
    isLoading: isTransactionLoading,
  } = useQuery({
    enabled: !!eventId.value,
    queryFn: ({ signal }) =>
      nuxtApp.$galantisApi
        .get(`/event/${eventId.value}/stats/transaction`, {
          params: filters?.value,
          signal,
        })
        .then(response => response.data.data as TransactionStats),
    queryKey: ['transaction-stats', eventId, filters],
  });

  // Custom Field Stats Query
  const {
    data: customFieldStats,
    error: customFieldError,
    isLoading: isCustomFieldLoading,
  } = useQuery({
    enabled: !!eventId.value,
    queryFn: ({ signal }) =>
      nuxtApp.$galantisApi
        .get(`/event/${eventId.value}/stats/custom-fields`, {
          params: filters?.value,
          signal,
        })
        .then(response => response.data.data as CustomFieldStats),
    queryKey: ['custom-field-stats', eventId, filters],
  });

  return {
    // Errors
    attendeeError,
    // Stats data
    attendeeStats,
    customFieldError,
    customFieldStats,
    // Loading states
    isAttendeeLoading,
    isCustomFieldLoading,
    isTransactionLoading,
    transactionError,
    transactionStats,
  };
};
