import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import type { CityOption } from '~/types/city';

export function useCitySearch(venueCity: Ref<string>) {
  const minCityLength = 3;
  const cityOptions = ref<CityOption[]>([]);
  const isLoading = ref(false);
  const hasMinLength = computed(() => (venueCity?.value?.length ?? 0) >= minCityLength);
  const selectedCity = ref<CityOption | null>(null);

  const searchCities = useDebounceFn(async (query: string) => {
    if (query.length < minCityLength) {
      cityOptions.value = [];
      return;
    }
    isLoading.value = true;
    try {
      const response: CityOption[] = await $fetch('/api/search-cities', {
        params: { city: query },
      });
      cityOptions.value = response;
    } catch (error) {
      console.error('Error fetching cities:', error);
      cityOptions.value = [];
    } finally {
      isLoading.value = false;
    }
  }, 300);

  return {
    venueCity,
    cityOptions,
    searchCities,
    isLoading,
    hasMinLength,
    selectedCity,
  };
}
