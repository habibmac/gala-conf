<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import { allRegStatuses } from "@/utils/status-map";

const props = defineProps<{
  modelValue: string;
}>();

// Computed property to get the list of statuses
const statuses = computed(() => [
  ...allRegStatuses.map((status) => ({
    label: status.label,
    value: status.label, // Assuming value should match id for consistency
    color: status.color,
  })),
]);

// Get the selected index from the modelValue
const selectedStatus = ref(props.modelValue);

const emits = defineEmits(["update:modelValue"]);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedStatus.value = newValue;
  }
);

// Use a method to handle selection changes
function updateValue(value: string) {
  emits("update:modelValue", value);
  selectedStatus.value = value; // Also update local state to ensure reactivity
}

// Computed property to find the label for the current selected value
const selectedStatusLabel = computed(() => {
  const status = statuses.value.find(
    (status) => status.value === selectedStatus.value
  );
  return status ? status.label : "All Status"; // Default label if not found
});

// Computed property to get the class for the selected status label
const selectedStatusClass = computed(() => {
  const status = statuses.value.find(
    (status) => status.value === selectedStatus.value
  );
  return status ? status.color : ""; // Default to empty string if not found
});
</script>

<template>
  <div class="">
    <Listbox v-model="selectedStatus">
      <div class="relative h-full w-full max-w-full">
        <ListboxButton
          :class="[
            selectedStatusClass,
            'form-select font-medium !text-slate-600 dark:!text-slate-400',
          ]"
        >
          <div class="line-clamp-1">
            {{ selectedStatusLabel || "All Status" }}
          </div>
        </ListboxButton>
      </div>
      <Transition
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        enter-active-class="transition duration-100 ease-out"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute z-40 grid grid-cols-1 mt-1 overflow-auto rounded-md border bg-white p-3 text-sm font-medium shadow-lg ring-black/5 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
        >
          <ListboxOption value="" @click="updateValue('')">
            <li class="list-option">All Status</li>
          </ListboxOption>
          <ListboxOption
            v-for="(status, index) in statuses"
            :key="index"
            :value="status.label"
            as="template"
            v-slot="{ active, selected }"
          >
            <li
              :class="[
                active
                  ? 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300'
                  : '',
                selected
                  ? 'bg-emerald-100 hover:bg-emerald-100 dark:bg-slate-900/50'
                  : '',
                'list-option',
              ]"
              @click="updateValue(status.label)"
            >
              <span :class="`dot ${status.color} h-2 w-2 rounded-full`"></span>
              <span>{{ status.label }}</span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </Transition>
    </Listbox>
  </div>
</template>
<style>
.list-option {
  @apply relative flex cursor-default select-none items-center space-x-2 px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-900/50;
}
</style>
