<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { allRegStatuses } from '@/utils';

const props = defineProps<{
  modelValue: string[]
}>();

const emits = defineEmits(['update:modelValue']);

// Responsive breakpoint detection
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => !breakpoints.md.value);

// Sheet state for mobile
const isSheetOpen = ref(false);

const selectedStatuses = ref<string[]>(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedStatuses.value = newValue;
  },
);

function updateValue(value: string) {
  let updatedStatuses: string[];

  // If we're currently in "All Status" state (empty array)
  if (selectedStatuses.value.length === 0) {
    // User is unchecking one item from "All Status"
    // So we need all statuses EXCEPT the one being unchecked
    updatedStatuses = filteredStatus.value
      .map(status => status.value)
      .filter(statusValue => statusValue !== value);
  }
  else {
    // Normal toggle behavior when in partial selection
    if (selectedStatuses.value.includes(value)) {
      // Removing a status
      updatedStatuses = selectedStatuses.value.filter(status => status !== value);
    }
    else {
      // Adding a status
      updatedStatuses = [...selectedStatuses.value, value];

      // Check if we now have all statuses selected
      if (updatedStatuses.length === filteredStatus.value.length) {
        // Convert to "All Status" (empty array)
        updatedStatuses = [];
      }
    }
  }

  emits('update:modelValue', updatedStatuses);
  selectedStatuses.value = updatedStatuses;
}

const filteredStatus = computed(() =>
  allRegStatuses.map(status => ({
    color: status.color,
    label: status.label,
    value: status.label,
  })),
);

// Removed selectedStatusLabels - not needed anymore

const selectedValues = computed(() => new Set(selectedStatuses.value));

const buttonLabel = computed(() => {
  // When no specific statuses selected = "All Status" (this represents all are active)
  if (selectedStatuses.value.length === 0) {
    return 'All Status';
  }
  // When all individual statuses are explicitly selected = "All Status"
  if (selectedStatuses.value.length === filteredStatus.value.length) {
    return 'All Status';
  }
  // Single selection
  if (selectedStatuses.value.length === 1) {
    return selectedStatuses.value[0];
  }
  // Multiple but not all
  return `${selectedStatuses.value.length} selected`;
});

// This function sets the filter to "All Status" (empty array)
function clearAllStatuses() {
  emits('update:modelValue', []);
  selectedStatuses.value = [];
}

// Mobile-specific functions
const shouldShowSelectAll = computed(() => {
  // Show "Select All" when some but not all statuses are selected
  return selectedStatuses.value.length > 0 && selectedStatuses.value.length < filteredStatus.value.length;
});

const toggleAllSelection = () => {
  if (shouldShowSelectAll.value) {
    // User wants to select all -> set to empty array (which means "All Status")
    emits('update:modelValue', []);
    selectedStatuses.value = [];
  }
  else {
    // Currently showing "All Status", user wants partial selection
    // Select just the first status to move to partial selection state
    if (filteredStatus.value.length > 0) {
      const firstStatus = [filteredStatus.value[0].value];
      emits('update:modelValue', firstStatus);
      selectedStatuses.value = firstStatus;
    }
  }
};

const toggleStatusMobile = (statusValue: string) => {
  updateValue(statusValue);
};

const isStatusSelected = (statusValue: string) => {
  return selectedStatuses.value.includes(statusValue);
};

const isAllStatusSelected = computed(() => {
  // "All Status" is selected when array is empty OR when all individual statuses are selected
  return selectedStatuses.value.length === 0 || selectedStatuses.value.length === filteredStatus.value.length;
});
</script>

<template>
  <div>
    <ClientOnly>
      <!-- Desktop: Original Popover -->
      <Popover v-if="!isMobile">
        <PopoverTrigger as-child>
          <Button variant="outline" class="relative h-[42px] bg-card dark:bg-background">
            <!-- Only show "Status" label and indicator when partial selection -->
            <span
              v-if="selectedStatuses.length > 0 && selectedStatuses.length < filteredStatus.length"
              class="border-r pr-2 text-xs text-slate-500"
            >Status</span>
            <span class="ml-2 font-medium">
              {{ buttonLabel }}
            </span>
            <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
            <span
              v-if="selectedStatuses.length > 0 && selectedStatuses.length < filteredStatus.length"
              class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-full p-0 sm:w-[200px]" align="center">
          <Command>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <CommandItem :value="{ label: 'All Status', value: '' }" @select="clearAllStatuses">
                  <div
                    :class="cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isAllStatusSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )"
                  >
                    <Icon icon="radix-icons:check" class="size-4" />
                  </div>
                  <span>All Status</span>
                </CommandItem>
                <CommandItem
                  v-for="item in filteredStatus" :key="item.value" :value="item"
                  @select="() => updateValue(item.value)"
                >
                  <div
                    :class="cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selectedValues.has(item.value) || isAllStatusSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )"
                  >
                    <Icon icon="radix-icons:check" class="size-4" />
                  </div>
                  <span :class="`dot ${item.color} h-2 w-2 rounded-full inline-block mr-2`" />
                  <span>{{ item.label }}</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <!-- Mobile: Button that opens sheet -->
      <Button
        v-else variant="outline" class="relative h-[42px] w-full bg-card dark:bg-background"
        @click="isSheetOpen = true"
      >
        <!-- Only show "Status" label and indicator when partial selection -->
        <span
          v-if="selectedStatuses.length > 0 && selectedStatuses.length < filteredStatus.length"
          class="border-r pr-2 text-xs text-slate-500"
        >Status</span>
        <span class="ml-2 font-medium">
          {{ buttonLabel }}
        </span>
        <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
        <span
          v-if="selectedStatuses.length > 0 && selectedStatuses.length < filteredStatus.length"
          class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500"
        />
      </Button>

      <!-- Mobile: Sheet/Drawer -->
      <Sheet v-model:open="isSheetOpen">
        <SheetContent side="bottom" class="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filter by Status</SheetTitle>
            <SheetDescription>
              Select statuses to filter the results
            </SheetDescription>
          </SheetHeader>

          <div class="mt-6 space-y-4">
            <!-- Action Button -->
            <div class="flex items-center justify-center">
              <Button variant="outline" size="sm" :disabled="filteredStatus.length === 0" @click="toggleAllSelection">
                <Icon :icon="shouldShowSelectAll ? 'heroicons:check' : 'heroicons:x-mark'" class="mr-2 size-4" />
                {{ shouldShowSelectAll ? 'Select All' : 'Clear Selection' }}
              </Button>
            </div>

            <Separator />

            <!-- Status List -->
            <div class="max-h-60 space-y-2 overflow-y-auto">
              <!-- Individual Statuses -->
              <div
                v-for="status in filteredStatus" :key="status.value"
                class="flex items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                :class="{ 'bg-muted/50': isAllStatusSelected || isStatusSelected(status.value) }"
                @click="toggleStatusMobile(status.value)"
              >
                <Checkbox
                  :checked="isAllStatusSelected || isStatusSelected(status.value)"
                  :disabled="selectedStatuses.length === 1 && isStatusSelected(status.value)" @click.stop
                  @update:checked="toggleStatusMobile(status.value)"
                />
                <div class="flex min-w-0 flex-1 items-center space-x-2">
                  <span :class="`dot ${status.color} h-3 w-3 rounded-full inline-block`" />
                  <div class="text-sm font-medium">
                    {{ status.label }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter class="mt-6">
            <Button class="w-full" @click="isSheetOpen = false">
              Apply Filters ({{ selectedStatuses.length === 0 ? 'All' : selectedStatuses.length }} selected)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </ClientOnly>
  </div>
</template>
