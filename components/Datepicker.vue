<script setup lang="ts">
import { ref, toRef, computed } from 'vue';
import { addDays, endOfDay, endOfMonth, startOfDay, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import VueDatePicker from '@vuepic/vue-datepicker';

const props = defineProps<{
  dateRange?: Date[] | null;
  enableTimePicker?: boolean | false;
  format?: string | 'd LLL yyyy';
  maxDate?: Date | null;
  minDate?: Date | null;
}>();

const defaultDateRange = computed(() => {
  if (props.dateRange && Array.isArray(props.dateRange) && props.dateRange.length === 2) {
    return props.dateRange;
  }
  return [startOfDay(new Date()), endOfDay(addDays(new Date(), 1))];
});

const emits = defineEmits(['update:dateRange']);
const colorMode = useColorMode();

const updateDateRange = (value: Date[]) => {
  emits('update:dateRange', value);
};

const presetDates = ref([
  { label: 'Today', value: [new Date(), new Date()] },
  { label: 'This month', value: [startOfMonth(new Date()), new Date()] },
  {
    label: 'Last month',
    value: [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))],
  },
  { label: 'This year', value: [startOfYear(new Date()), new Date()] },
]);
</script>

<template>
  <div class="relative">
    <ClientOnly>
      <VueDatePicker
        :model-value="dateRange"
        range
        multi-calendars
        :enable-time-picker="enableTimePicker"
        :format-locale="id"
        @update:model-value="updateDateRange"
        placeholder="All Time"
        :preset-dates="presetDates"
        :max-date="maxDate || undefined"
        :min-date="minDate || undefined"
        :format="format"
        :dark="colorMode.value === 'dark'"
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
          heloooo
        </template>
      </VueDatePicker>
    </ClientOnly>
          <span
          v-if="dateRange"
          class="absolute h-2 w-2 rounded-full right-0.5 top-0.5 bg-rose-500"
        ></span>
  </div>
</template>
