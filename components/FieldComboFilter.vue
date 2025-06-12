<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  TransitionRoot,
} from '@headlessui/vue';
import { Icon } from '@iconify/vue';
import { useField } from 'vee-validate';
import { computed, ref } from 'vue';

import type { CityOption } from '~/types';

import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useCitySearch } from '~/composables/useCitySearch';

const props = defineProps<{
  name: string
  defaultValue?: string
  class?: HTMLAttributes['class']
  label?: string
  placeholder?: string
  wrapperClass?: string
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string): void
  (e: 'select', payload: { city: string, state: string, country: string }): void
}>();

const { handleChange, resetField, validate, value } = useField(() => props.name, undefined, {
  initialValue: props.defaultValue,
});

const error = useFieldError(props.name);

const isInteracting = ref(false);
const showLabel = computed(() => (isInteracting.value && !!value.value) || value.value);

const handleFocus = () => {
  isInteracting.value = true;
};

const handleBlur = async () => {
  isInteracting.value = false;
  await validate();
};

const { cityOptions, hasMinLength, isLoading, searchCities, selectedCity } = useCitySearch(value);

const selectCity = (city: CityOption) => {
  value.value = city.city;
  selectedCity.value = city;
  handleChange(city.city);
  emits('update:modelValue', city.city);
  emits('select', {
    city: city.city,
    country: city.country,
    state: city.state,
  });
};

const clearSelection = () => {
  selectedCity.value = null;
  value.value = '';
  emits('update:modelValue', '');
  emits('select', { city: '', country: '', state: '' });
  resetField();
};

const updateQuery = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const query = target.value;
  value.value = query;
  emits('update:modelValue', query);
  searchCities(query);
};

const displayValue = (item: unknown): string => {
  if (typeof item === 'object' && item !== null && 'city' in item) {
    return (item as CityOption).city;
  }
  else if (value.value) {
    return value.value;
  }
  return ''; // Add default return value
};

watch(value, (newValue) => {
  if (newValue) {
    useCitySearch(ref(newValue));
  }
  else if (newValue === '') {
    resetField();
  }
});
</script>

<template>
  <FormField :name="name">
    <FormItem :class="cn('relative', wrapperClass)">
      <Combobox v-model="value" @update:model-value="selectCity">
        <div class="group relative transition-all duration-200">
          <FormLabel
            :for="props.name"
            :class="
              cn(
                'pointer-events-none absolute z-10 px-3 font-medium text-xs text-muted-foreground transition-all duration-200',
                showLabel ? 'opacity-100 -translate-y-4 top-5' : 'opacity-0 top-5',
              )
            "
          >
            {{ props.label }}
          </FormLabel>
          <FormControl>
            <div
              :class="
                cn(
                  'z-1 grid cursor-text rounded-md shadow-sm border min-h-[50px] transition-all duration-200 ease-in-out border-input',
                  { 'border-destructive': error },
                  { 'border-primary': isInteracting },
                )
              "
            >
              <ComboboxInput
                id="city-search"
                v-model="value"
                :display-value="displayValue"
                :placeholder="label"
                autocomplete="password"
                :class="
                  cn(
                    'text-sm w-full bg-transparent appearance-none transition-all duration-200 ease-in-out rounded-md p-3 border-none outline-none focus:outline-none focus:ring-2 ring-primary focus:border-none text-ellipsis placeholder:text-muted-foreground',
                    showLabel ? 'pt-4 pb-1 placeholder:opacity-0' : 'placeholder:opacity-100',
                  )
                "
                @change="updateQuery"
                @focus="handleFocus"
                @blur="handleBlur"
              />
              <ClientOnly>
                <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
                  <Icon
                    v-if="isLoading"
                    icon="eos-icons:loading"
                    class="size-5 animate-spin"
                    aria-hidden="true"
                  />
                  <Icon
                    v-else-if="selectedCity"
                    icon="heroicons:x-mark"
                    class="size-5 cursor-pointer"
                    aria-hidden="true"
                    @click.stop="clearSelection"
                  />
                  <Icon
                    v-else
                    icon="heroicons:chevron-down"
                    class="size-4"
                    aria-hidden="true"
                  />
                </ComboboxButton>
              </ClientOnly>
            </div>
          </FormControl>
        </div>
        <TransitionRoot leave="transition ease-in duration-100" leave-from="opacity-100" leave-to="opacity-0">
          <ComboboxOptions
            class="absolute z-20 max-h-60 w-full max-w-sm overflow-auto rounded-md bg-card py-1 text-sm shadow-lg focus:outline-none"
          >
            <div v-if="cityOptions.length === 0 && value !== ''" class="relative cursor-default select-none px-4 py-2">
              {{ hasMinLength ? 'No cities found.' : 'Type more to search...' }}
            </div>
            <ComboboxOption
              v-for="city in cityOptions"
              :key="city.city + city.state + city.country"
              v-slot="{ selected, active }"
              :value="city"
            >
              <li
                class="relative cursor-default select-none p-2"
                :class="{
                  'bg-muted': active,
                }"
              >
                <span
                  class="block truncate"
                  :class="{
                    'pl-7 font-medium': selected,
                    'font-normal': !selected,
                  }"
                >
                  {{ city.city }} - {{ city.state }}, {{ city.country }}
                </span>
                <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon icon="heroicons:check" class="size-5" aria-hidden="true" />
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </TransitionRoot>
      </Combobox>
      <Transition name="fade">
        <FormMessage v-if="error && !isInteracting" :message="error" />
      </Transition>
    </FormItem>
  </FormField>
</template>
