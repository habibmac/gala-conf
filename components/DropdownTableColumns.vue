<!-- DropdownTableColumns.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { Icon } from "@iconify/vue";

interface ColumnConfig {
  key: string;
  header: string;
  isVisible: boolean;
  isHideable: boolean;
}

const props = defineProps<{
  modelValue: Record<string, boolean>;
  columns: ColumnConfig[];
}>();

const dropdownOpen = ref(false);
const trigger = ref<HTMLElement | null>(null);
const dropdown = ref<HTMLElement | null>(null);

const emit = defineEmits<{
  (e: "update:modelValue", value: Record<string, boolean>): void;
}>();

const localColumnVisibility = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    localColumnVisibility.value = { ...newValue };
  }
);

const toggleColumn = (column: string) => {
  if (props.columns.find((c) => c.key === column)?.isHideable) {
    localColumnVisibility.value[column] = !localColumnVisibility.value[column];
    emit("update:modelValue", { ...localColumnVisibility.value });
  }
};

// Close on click outside
const clickHandler = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!dropdownOpen.value) return;

  // Check if the click is inside the dropdown
  if (dropdown.value && dropdown.value.contains(target)) {
    // If the clicked element is a form-switch or its children, don't close the dropdown
    if (target.closest(".form-switch")) {
      return;
    }
  }

  // If the click is on the trigger, don't close (it's handled elsewhere)
  if (trigger.value && trigger.value.contains(target)) {
    return;
  }

  // If we've reached here, close the dropdown
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
  <div class="relative w-full">
    <ClientOnly>
      <!-- Dropdown trigger button -->
      <button
        ref="trigger"
        size="icon"
        aria-haspopup="true"
        class="form-select w-full text-left font-medium !text-slate-600 dark:!text-slate-400"
        @click.prevent="dropdownOpen = !dropdownOpen"
        :aria-expanded="dropdownOpen"
      >
        <Icon icon="heroicons:view-columns" class="w-5 h-5" />
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
          ref="dropdown"
          class="absolute z-50 mt-1 max-h-[300px] min-w-80 right-0 rounded-md border bg-white p-3 text-sm font-medium shadow-lg ring-black/5 focus:outline-none md:max-w-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <ul class="grid grid-rows-9 grid-flow-col gap-2">
            <li
              v-for="column in columns"
              :key="column.key"
              :value="column.key"
              class="flex space-x-1"
            >
              <div
                class="form-switch form-switch-sm"
                :class="{ 'opacity-50 cursor-not-allowed': !column.isHideable }"
              >
                <input
                  type="checkbox"
                  :id="column.key"
                  class="sr-only"
                  :checked="localColumnVisibility[column.key]"
                  @change="toggleColumn(column.key)"
                  :disabled="!column.isHideable"
                  true-value="On"
                  false-value="Off"
                />
                <label class="bg-slate-400 dark:bg-slate-700" :for="column.key">
                  <span class="bg-white shadow-sm" aria-hidden="true"></span>
                  <span class="sr-only">Toggle</span>
                </label>
              </div>
              <span class="ml-2">{{ column.header }}</span>
            </li>
          </ul>
        </div>
      </Transition>
    </ClientOnly>
  </div>
</template>
