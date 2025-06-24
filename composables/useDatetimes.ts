import type { Ref } from 'vue';

import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

export interface DatetimeOption {
  id: string
  name: string
  date_start: string
  date_end: string
  sold?: number
  reg_limit?: number
  is_active?: boolean
  is_upcoming?: boolean
  is_expired?: boolean
}

export const useDatetimes = (eventId: Ref<string>) => {
  const { $galantisApi } = useNuxtApp();

  const fetchDatetimes = async (eventId: string): Promise<DatetimeOption[]> => {
    const response = await $galantisApi.get(`/event/${eventId}/datetimes`);
    return response.data || [];
  };

  const {
    data: datetimes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['datetimes', eventId],
    queryFn: () => fetchDatetimes(eventId.value),
    enabled: computed(() => !!eventId.value),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Selected datetime state
  const selectedDatetime = ref<string>('');

  // Computed properties
  const selectedDatetimeInfo = computed(() => {
    if (!selectedDatetime.value || !datetimes.value)
      return null;
    return datetimes.value.find(dt => dt.id === selectedDatetime.value) || null;
  });

  // Helper methods
  const setSelectedDatetime = (datetimeId: string) => {
    selectedDatetime.value = datetimeId;
  };

  const clearSelectedDatetime = () => {
    selectedDatetime.value = '';
  };

  return {
    // Data
    datetimes: computed(() => datetimes.value || []),
    selectedDatetime: readonly(selectedDatetime),
    selectedDatetimeInfo,

    // State
    isLoading,
    isError,
    error,

    // Methods
    setSelectedDatetime,
    clearSelectedDatetime,
    refetch,
  };
};
