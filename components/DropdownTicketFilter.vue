<script setup lang="ts">
import { ref, type Ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { Icon } from "@iconify/vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";

const props = defineProps<{
  modelValue: string;
}>();

const { event } = useEvent();
const evtId = computed(() => event.value?.id);

const selectedTicket = ref(props.modelValue); // Make modelValue reactive

const emits = defineEmits(["update:modelValue"]);

const getData = async (evtId: Ref<string>) => {
  const { $galantisApi } = useNuxtApp();
  return $galantisApi

    .get(`/event/${evtId.value}/tickets`)
    .then((response) => {
      if (response.data.length > 0) {
        return response.data;
      } else {
        throw new Error("No event found");
      }
    })
    .catch((error) => {
      throw new Error(error);
    });
};

const {
  isLoading,
  isError,
  error,
  data: tickets,
} = useQuery({
  queryKey: ["tickets", evtId.value],
  queryFn: () => getData(evtId),
  enabled: !!evtId.value,
  staleTime: 1000 * 60 * 5, // 5 minutes
});

watch(
  () => props.modelValue,
  (newValue) => {
    selectedTicket.value = newValue;
  }
);

// Use a method to handle selection changes
function updateValue(value: string) {
  emits("update:modelValue", value);
  selectedTicket.value = value; // Also update local state to ensure reactivity
}
</script>

<template>
  <ClientOnly>
    <Listbox v-model="selectedTicket">
      <div class="relative">
        <ListboxButton
          class="form-select font-medium !w-auto space-x-2 max-w-xs"
        >
          <span v-if="selectedTicket" class="text-xs text-slate-500 border-r pr-2">
            Ticket
          </span>
          <span class="truncate">
            {{ selectedTicket ? selectedTicket : "All Tickets" }}
          </span>
          <Icon
            icon="heroicons:chevron-down"
          />
        </ListboxButton>
        <Transition
          enter-active-class="transition ease-out duration-200 transform"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-out duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute left-0 top-full z-20 min-w-80 origin-top-left overflow-y-scroll scroll-area max-h-[400px] rounded-md mt-1 border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950"
          >
            <ListboxOption :value="null" as="template">
              <li
                :class="[
                  selectedTicket === '' ? 'selected' : '',
                  'dropdown-item justify-between',
                ]"
                @click="updateValue('')"
              >
                <span class="text-sm">All Tickets</span>
                <Icon
                  icon="heroicons:check"
                  v-if="selectedTicket === ''"
                  class="check"
                />
              </li>
            </ListboxOption>
            <ListboxOption
              v-for="ticket in tickets"
              :key="ticket.id"
              :value="ticket.name"
              as="template"
            >
              <li
                :class="[
                  ticket.name === selectedTicket ? 'selected' : '',
                  'dropdown-item justify-between',
                ]"
                @click="updateValue(ticket.name)"
              >
                <span class="text-sm">{{ ticket.name }}</span>
                <Icon
                  icon="heroicons:check"
                  v-if="ticket.name === selectedTicket"
                  class="check"
                />
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  </ClientOnly>
</template>
