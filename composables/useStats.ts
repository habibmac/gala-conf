// composables/useStats.ts
import { type Ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { AttendeeStats, TransactionStats, CustomFieldStats, StatsFilters } from '@/types/stats';

export const useStats = (eventId: Ref<string>, filters?: Ref<StatsFilters>) => {
  const nuxtApp = useNuxtApp();

  // Attendee Stats Query
  const {
    data: attendeeStats,
    error: attendeeError,
    isLoading: isAttendeeLoading,
  } = useQuery({
    queryKey: ['attendee-stats', eventId, filters],
    queryFn: ({ signal }) =>
      nuxtApp.$galantisApi
        .get(`/event/${eventId.value}/stats/attendee`, {
          params: filters?.value,
          signal,
        })
        .then((response) => response.data.data as AttendeeStats),
    enabled: !!eventId.value,
  });

  // Transaction Stats Query
  const {
    data: transactionStats,
    error: transactionError,
    isLoading: isTransactionLoading,
  } = useQuery({
    queryKey: ['transaction-stats', eventId, filters],
    queryFn: ({ signal }) =>
      nuxtApp.$galantisApi
        .get(`/event/${eventId.value}/stats/transaction`, {
          params: filters?.value,
          signal,
        })
        .then((response) => response.data.data as TransactionStats),
    enabled: !!eventId.value,
  });

  // Custom Field Stats Query
  const {
    data: customFieldStats,
    error: customFieldError,
    isLoading: isCustomFieldLoading,
  } = useQuery({
    queryKey: ['custom-field-stats', eventId, filters],
    queryFn: ({ signal }) =>
      nuxtApp.$galantisApi
        .get(`/event/${eventId.value}/stats/custom-fields`, {
          params: filters?.value,
          signal,
        })
        .then((response) => response.data.data as CustomFieldStats),
    enabled: !!eventId.value,
  });

  return {
    // Stats data
    attendeeStats,
    transactionStats,
    customFieldStats,
    // Loading states
    isAttendeeLoading,
    isTransactionLoading,
    isCustomFieldLoading,
    // Errors
    attendeeError,
    transactionError,
    customFieldError,
  };
};
