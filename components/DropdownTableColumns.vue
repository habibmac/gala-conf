<!-- DropdownTableColumns.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";

interface ColumnConfig {
  key: string;
  header: string;
  isVisible: boolean;
  isHideable: boolean;
}

const props = defineProps<{
  modelValue: ColumnConfig[];
}>();

const columns = ref(props.modelValue);

const emits = defineEmits(["update:columns"]);

onMounted(() => {
  watch(
    columns,
    (newValue) => {
      emits("update:columns", newValue);
    },
    { deep: true }
  );
});

function toggleColumnVisibility(column: ColumnConfig) {
  column.isVisible = !column.isVisible;
}
</script>

<template>
  <ClientOnly>
    <div class="relative">
      <Listbox multiple>
        <ListboxButton
          class="form-select !w-auto space-x-2 h-[42px]"
        >
          <Icon icon="teenyicons:adjust-horizontal-alt-outline" class="w-4 h-4" />
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
            class="absolute z-20 mt-1 max-h-[400px] overflow-y-auto min-w-40 right-0 rounded-md border p-1 text-sm font-medium ring-black/5 focus:outline-none md:max-w-sm border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950"
          >
            <ListboxOption
              v-for="column in columns"
              :key="column.key"
              :value="column.key"
              @click="
                (e) => {
                  if (!column.isHideable) return;
                  toggleColumnVisibility(column);
                }
              "
              :disabled="!column.isHideable"
              as="div"
              class="dropdown-item relative !py-0.5 !pl-0"
              :class="{
                'opacity-50 !cursor-not-allowed': !column.isHideable,
              }"
            >
              <div class="form-switch form-switch-sm">
                <input
                  type="checkbox"
                  :id="column.key"
                  class="sr-only"
                  :checked="column.isVisible"
                  :disabled="!column.isHideable"
                />
                <label class="bg-slate-400 dark:bg-slate-700" for="toggle2">
                  <span class="bg-white shadow-sm" aria-hidden="true"></span>
                  <span class="sr-only">Toggle</span>
                </label>
              </div>
              <div>
                <span class="block truncate">{{ column.header }}</span>
              </div>
              <!-- <span
                :class="{ 'font-semibold': column.isVisible }"
                class="block truncate"
              >
                {{ column.header }}
              </span>
              <span
                v-if="column.isVisible"
                class="absolute inset-y-0 right-0 flex items-center pr-4"
              >
                <Icon icon="bi:check2" class="h-5 w-5 text-blue-600" />
              </span> -->
            </ListboxOption>
          </ListboxOptions>
        </Transition>
      </Listbox>
    </div>
  </ClientOnly>
</template>
