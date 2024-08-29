<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import { Icon } from "@iconify/vue";
import { allRegStatuses } from "@/utils";

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
  <ClientOnly>
    <Listbox v-model="selectedStatus">
      <div class="relative">
        <ListboxButton
          class="form-select !w-auto space-x-2"
          v-slot="{ open }"
        >
          <span v-if="selectedStatus" class="text-xs text-slate-500 border-r pr-2">
            Status
            <span
              :class="`dot ${selectedStatusClass} h-2 w-2 rounded-full`"
            ></span>
          </span>
          <span class="font-medium">
            {{ selectedStatusLabel }}
          </span>
          <Icon
            icon="heroicons:chevron-down"
            :class="
              [
                open ? 'transform rotate-180' : '',
                'w-3.5 h-3.w-3.5 text-slate-600 dark:text-slate-400',
              ]
            "
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
            class="absolute left-0 top-full z-20 min-w-24 origin-top-left max-h-[400px] overflow-y-auto rounded-md mt-1 border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950 scroll-area"
            as="ul" 
          >
            <ListboxOption
              :value="null"
              v-slot="{ active, selected }"
            >
              <li
                :class="[
                  selected
                    ? 'selected'
                    : '',
                  'dropdown-item',
                ]"
                @click="updateValue('')"
              >
                <span class="dot h-2 w-2 rounded-full"></span>
                <span>All Status</span>
              </li>
            </ListboxOption>
            <ListboxOption
              v-for="(item, index) in statuses"
              :key="index"
              :value="item.label"
              :disabled="item.label === selectedStatus"
                          v-slot="{ active, selected }"

              as="template"
            >
              <li
                :class="[
                  selected
                    ? 'selected'
                    : '',
                
                  'dropdown-item !space-x-2',
                ]"
                @click="updateValue(item.label)"
              >
                <span
                  :class="`dot ${item.color} h-2 w-2 rounded-full`"
                ></span>
                <span>{{ item.label }}</span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  </ClientOnly>
</template>
