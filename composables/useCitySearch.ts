import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { CityOption } from '~/types/city'

export function useCitySearch(initialValue: string = '') {
    const venueCity = ref(initialValue)
    const minCityLength = 3
    const cityOptions = ref<CityOption[]>([])
    const isLoading = ref(false)
    const hasMinLength = ref(false)
    const selectedCity = ref<CityOption | null>(null)

    const searchCities = useDebounceFn(async (query: string) => {
        if (query.length < minCityLength) {
            cityOptions.value = []
            hasMinLength.value = false
            return
        }
        hasMinLength.value = true
        isLoading.value = true
        try {
            const response: CityOption[] = await $fetch('/api/search-cities', {
                params: { city: query }
            })
            cityOptions.value = response
        } catch (error) {
            console.error('Error fetching cities:', error)
            cityOptions.value = []
        } finally {
            isLoading.value = false
        }
    }, 300)

    watch(venueCity, (newValue) => {
        searchCities(newValue)
    })

    return {
        venueCity,
        cityOptions,
        searchCities,
        isLoading,
        hasMinLength,
        selectedCity
    }
}