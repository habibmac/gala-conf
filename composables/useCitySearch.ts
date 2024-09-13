import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { CityOption } from '~/types/city'

export function useCitySearch() {
    const venueCity = ref('')
    const minCityLength = 3
    const cityOptions = ref<CityOption[]>([])

    const searchCities = useDebounceFn(async (query: string) => {
        if (query.length < minCityLength) {
            cityOptions.value = []
            return
        }

        try {
            const response: CityOption[] = await $fetch('/api/search-cities', {
                params: { city: query }
            })
            cityOptions.value = response
        } catch (error) {
            console.error('Error fetching cities:', error)
            cityOptions.value = []
        }
    }, 300)

    watch(venueCity, (newValue) => {
        searchCities(newValue)
    })

    return {
        venueCity,
        cityOptions,
        searchCities
    }
}