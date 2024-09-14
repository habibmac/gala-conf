<script setup lang="ts">
import { watch, onMounted } from "vue";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from "@headlessui/vue";
import { Icon } from "@iconify/vue";
import { useCitySearch } from "~/composables/useCitySearch";
import type { CityOption } from "~/types/city";

const props = withDefaults(
  defineProps<{
    modelValue: string;
  }>(),
  {
    modelValue: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "select", value: CityOption): void;
}>();

const { venueCity, cityOptions, isLoading, hasMinLength, selectedCity } = useCitySearch(props.modelValue);

const onSelect = (city: CityOption | null) => {
  if (city) {
    emit("update:modelValue", city.city);
    emit("select", city);
  }
  selectedCity.value = city;
};

const clearSelection = () => {
  selectedCity.value = null;
  venueCity.value = "";
  emit("update:modelValue", "");
};

const updateQuery = (query: string | undefined) => {
  venueCity.value = query ?? '';
  emit("update:modelValue", query ?? '');
};

const displayValue = (item: unknown): string => {
  if (typeof item === "object" && item !== null && "city" in item) {
    return (item as CityOption).city;
  }
  return venueCity.value;
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== venueCity.value) {
      venueCity.value = newValue;
    }
  }
);

onMounted(() => {
  if (props.modelValue && props.modelValue !== venueCity.value) {
    venueCity.value = props.modelValue;
  }
});
</script>

<template>
  <div>
    <ClientOnly>
      <Combobox v-model="selectedCity" @update:modelValue="onSelect">
        <div class="relative">
           <ComboboxInput
            class="form-input w-full pr-8"
            :displayValue="displayValue"
            :modelValue="venueCity"
            @update:modelValue="updateQuery"
            :placeholder="
              hasMinLength ? 'Search for a city' : 'Type to search...'
            "
            autocomplete="new-password"
          />
          <ComboboxButton
            class="absolute inset-y-0 right-0 flex items-center pr-2"
          >
            <Icon
              v-if="isLoading"
              icon="eos-icons:loading"
              class="h-5 w-5 animate-spin"
              aria-hidden="true"
            />
            <Icon
              v-else-if="selectedCity"
              icon="heroicons:x-mark"
              @click.stop="clearSelection"
              class="h-5 w-5 cursor-pointer"
              aria-hidden="true"
            />
            <Icon
              v-else
              icon="heroicons:chevron-down"
              class="h-4 w-4"
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>
        <TransitionRoot
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ComboboxOptions
            v-show="venueCity !== ''"
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card py-1 shadow-lg focus:outline-none text-sm"
          >
            <div
              v-if="cityOptions.length === 0 && venueCity !== ''"
              class="relative cursor-default select-none py-2 px-4"
            >
              Nothing found.
            </div>
            <ComboboxOption
              v-for="city in cityOptions"
              :key="city.city + city.state + city.country"
              :value="city"
              v-slot="{ selected, active }"
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
                    'font-medium pl-7': selected,
                    'font-normal': !selected,
                  }"
                >
                  {{ city.city }} - {{ city.state }}, {{ city.country }}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3"
                >
                  <Icon
                    icon="heroicons:check"
                    class="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </TransitionRoot>
      </Combobox>
    </ClientOnly>
  </div>
</template>
