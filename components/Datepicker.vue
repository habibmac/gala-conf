<script setup lang="ts">
import { ref, toRef } from "vue";
import { endOfMonth, startOfMonth, startOfYear, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import VueDatePicker from "@vuepic/vue-datepicker";

const props = defineProps<{
  dateRange: Date[] | null;
}>();

const dateRangeRef = toRef(props, "dateRange");
const emits = defineEmits(["update:dateRange"]);

const colorMode = useColorMode();

const updateDateRange = (value: Date[]) => {
  emits("update:dateRange", value);
};

const presetDates = ref([
  { label: "Today", value: [new Date(), new Date()] },
  { label: "This month", value: [startOfMonth(new Date()), new Date()] },
  {
    label: "Last month",
    value: [
      startOfMonth(subMonths(new Date(), 1)),
      endOfMonth(subMonths(new Date(), 1)),
    ],
  },
  { label: "This year", value: [startOfYear(new Date()), new Date()] },
]);
</script>

<template>
  <div class="relative">
    <ClientOnly>
      <VueDatePicker
        :model-value="dateRangeRef"
        range
        multi-calendars
        :enable-time-picker="false"
        :format-locale="id"
        @update:model-value="updateDateRange"
        placeholder="All Time"
        :preset-dates="presetDates"
        :max-date="new Date()"
        format="d LLL yyyy"
        :dark="colorMode.preference === 'dark'"
        input-class-name="placeholder:!text-slate-600 placeholder:!font-medium dark:!text-slate-400 dark:placeholder:!text-slate-400"
        menu-class-name="dark:bg-slate-800"
      >
        <template #preset-date-range-button="{ label, value, presetDate }">
          <span
            role="button"
            :tabindex="0"
            @click="presetDate(value)"
            @keyup.enter.prevent="presetDate(value)"
            @keyup.space.prevent="presetDate(value)"
          >
            {{ label }}
          </span>
        </template>
      </VueDatePicker>
    </ClientOnly>
  </div>
</template>
