<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker';
import { endOfMonth, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { ref } from 'vue';

defineProps<{
  dateRange?: Date[] | null
  enableTimePicker?: boolean | false
  format?: string | 'd LLL yyyy'
  maxDate?: Date | null
  minDate?: Date | null
}>();

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
        placeholder="All Time"
        :preset-dates="presetDates"
        :max-date="maxDate || undefined"
        :min-date="minDate || undefined"
        :format="format"
        :dark="colorMode.value === 'dark'"
        @update:model-value="updateDateRange"
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
    <span v-if="dateRange" class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500" />
  </div>
</template>
