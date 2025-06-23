<script setup lang="ts">
import { Icon } from '@iconify/vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { endOfMonth, format, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { computed, ref } from 'vue';

const props = defineProps<{
  dateRange?: Date[] | null
  enableTimePicker?: boolean | false
  format?: string | 'd LLL yyyy'
  maxDate?: Date | null
  minDate?: Date | null
}>();

const emits = defineEmits(['update:dateRange']);

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => !breakpoints.md.value);
const isSheetOpen = ref(false);

const colorMode = useColorMode();

const presetDates = [
  { label: 'Today', value: [new Date(), new Date()] },
  { label: 'This month', value: [startOfMonth(new Date()), new Date()] },
  {
    label: 'Last month',
    value: [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))],
  },
  { label: 'This year', value: [startOfYear(new Date()), new Date()] },
];

function updateDateRange(value: Date[] | null) {
  emits('update:dateRange', value);
  // On mobile, close sheet after selection
  if (isMobile.value)
    isSheetOpen.value = false;
}

function formatDateRange(dateRange: Date[] | null) {
  if (
    !dateRange
    || dateRange.length !== 2
    || !(dateRange[0] instanceof Date)
    || Number.isNaN(dateRange[0].getTime())
    || !(dateRange[1] instanceof Date)
    || Number.isNaN(dateRange[1].getTime())
  ) {
    return 'All Time';
  }
  try {
    // Use Indonesian locale for formatting
    return `${format(dateRange[0], 'd LLL yyyy')} - ${format(dateRange[1], 'd LLL yyyy')}`;
  }
  catch {
    return 'All Time';
  }
}
</script>

<template>
  <div class="relative">
    <!-- Desktop: Inline DatePicker -->
    <ClientOnly>
      <VueDatePicker
        v-if="!isMobile"
        :model-value="props.dateRange"
        range
        multi-calendars
        :enable-time-picker="props.enableTimePicker"
        placeholder="All Time"
        :preset-dates="presetDates"
        :max-date="props.maxDate || undefined"
        :min-date="props.minDate || undefined"
        :format="props.format"
        :dark="colorMode.value === 'dark'"
        @update:model-value="updateDateRange"
      />
      <!-- Mobile: Button to open Sheet -->
      <Button
        v-else
        variant="outline"
        class="w-full justify-start bg-card text-left font-normal"
        @click="isSheetOpen = true"
      >
        <Icon icon="heroicons:calendar-days" class="mr-2 size-4" />
        {{ formatDateRange(props.dateRange || null) }}
      </Button>
    </ClientOnly>

    <!-- Date range indicator -->
    <span
      v-if="props.dateRange && props.dateRange.length === 2"
      class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500"
    />

    <!-- Mobile: Sheet with DatePicker -->
    <Sheet v-model:open="isSheetOpen">
      <SheetContent side="bottom" class="min-h-screen overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Select Date Range</SheetTitle>
          <SheetDescription>
            Choose a date range to filter the results
          </SheetDescription>
        </SheetHeader>

        <div class="scroll-area mt-6 max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto">
          <!-- Preset Options -->
          <div class="space-y-2">
            <h4 class="text-sm font-medium">
              Quick Select
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <Button
                v-for="preset in presetDates"
                :key="preset.label"
                variant="outline"
                size="sm"
                class="text-xs"
                @click="updateDateRange(preset.value)"
              >
                {{ preset.label }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="text-xs"
                @click="updateDateRange(null)"
              >
                All Time
              </Button>
            </div>
          </div>

          <Separator />

          <!-- Custom Date Picker (just like desktop, but inline) -->
          <div class="space-y-2">
            <h4 class="text-sm font-medium">
              Custom Range
            </h4>
            <ClientOnly>
              <VueDatePicker
                :model-value="props.dateRange"
                range
                :enable-time-picker="props.enableTimePicker"
                placeholder="Select custom range"
                :max-date="props.maxDate || undefined"
                :min-date="props.minDate || undefined"
                :format="props.format"
                :dark="colorMode.value === 'dark'"
                inline
                auto-apply
                @update:model-value="updateDateRange"
              />
            </ClientOnly>
          </div>
        </div>

        <SheetFooter class="mt-6">
          <Button class="w-full" @click="isSheetOpen = false">
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
</template>

<style>
.dp__theme_dark {
  --dp-background-color: theme('colors.background');
  --dp-text-color: theme('colors.foreground');
  --dp-hover-color: theme('colors.accent.DEFAULT');
  --dp-hover-text-color: theme('colors.accent.foreground');
  --dp-hover-icon-color: theme('colors.accent.foreground');
  --dp-primary-color: theme('colors.primary.DEFAULT');
  --dp-primary-text-color: theme('colors.primary.foreground');
  --dp-secondary-color: theme('colors.muted.DEFAULT');
  --dp-border-color: theme('colors.border');
  --dp-menu-border-color: theme('colors.border');
  --dp-border-color-hover: theme('colors.border');
  --dp-disabled-color: theme('colors.muted.foreground');
  --dp-scroll-bar-background: theme('colors.muted.DEFAULT');
  --dp-scroll-bar-color: theme('colors.muted.foreground');
  --dp-success-color: theme('colors.primary.DEFAULT');
  --dp-success-color-disabled: theme('colors.muted.DEFAULT');
  --dp-icon-color: theme('colors.muted.foreground');
  --dp-danger-color: theme('colors.destructive.DEFAULT');
  --dp-highlight-color: theme('colors.primary.DEFAULT');
}

/* Mobile specific styles */
@media (max-width: 768px) {
  .dp__menu {
    width: 100% !important;
  }
}
</style>
