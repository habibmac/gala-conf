<script setup lang="ts">
import { onMounted, onUnmounted, ref, type Ref, toRef, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";

const props = defineProps<{
  modelValue: string;
  evtId: string;
}>();

const selectedTicket = ref(props.modelValue); // Make modelValue reactive

const dropdownOpen = ref(false);
const trigger = ref<HTMLElement | null>(null);
const dropdown = ref<HTMLElement | null>(null);

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
  queryKey: ["tickets", toRef(props, "evtId")],
  queryFn: () => getData(toRef(props.evtId)),
  enabled: !!props.evtId,
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

// Close on click outside
const clickHandler = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (
    !dropdownOpen.value ||
    (dropdown.value && dropdown.value.contains(target)) ||
    (trigger.value && trigger.value.contains(target))
  )
    return;
  dropdownOpen.value = false;
};

// Close if the ESC key is pressed
const keyHandler = (event: KeyboardEvent) => {
  if (!dropdownOpen.value || event.key !== "Escape") return;
  dropdownOpen.value = false;
};

onMounted(() => {
  document.addEventListener("click", clickHandler);
  document.addEventListener("keydown", keyHandler);
});

onUnmounted(() => {
  document.removeEventListener("click", clickHandler);
  document.removeEventListener("keydown", keyHandler);
});
</script>

<template>
  <div class="w-full">
    <button
      ref="trigger"
      aria-haspopup="true"
      class="form-select w-full text-left font-medium !text-slate-600 dark:!text-slate-400"
      @click.prevent="dropdownOpen = !dropdownOpen"
      :aria-expanded="dropdownOpen"
    >
      <div class="line-clamp-1">
        {{ selectedTicket || "All Tickets" }}
      </div>
    </button>
    <Transition
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      enter-active-class="transition duration-100 ease-out"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-show="dropdownOpen"
        class="absolute z-50 mt-1 grid max-h-[500px] w-full grid-cols-1 rounded-md border bg-white p-3 text-sm font-medium shadow-lg ring-black/5 focus:outline-none md:max-w-sm dark:border-slate-700 dark:bg-slate-800 scroll-area overflow-y-scroll"
      >
        <template v-if="isLoading">
          <div as="template" disabled>
            <div class="list-option">Loading...</div>
          </div>
        </template>
        <template v-else-if="isError">
          <div as="template" disabled>{{ error }}</div>
        </template>
        <template v-else>
          <ul>
            <li
              @click="updateValue('')"
              :class="`${selectedTicket === '' ? 'active' : ''} list-option`"
            >
              All Tickets
            </li>
            <li
              v-for="ticket in tickets"
              :key="ticket.id"
              :value="ticket.name"
              :class="[
                selectedTicket === ticket.name ? 'active' : '',
                'list-option',
              ]"
              @click="updateValue(ticket.name)"
            >
              <div class="line-clamp-1 overflow-ellipsis">
                {{ ticket.name }}
              </div>
            </li>
          </ul>
        </template>
      </div>
    </Transition>
  </div>
</template>
