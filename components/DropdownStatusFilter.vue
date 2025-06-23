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

// Simplified: Just toggle individual statuses
function updateValue(value: string) {
  let updatedStatuses: string[];

  if (selectedStatuses.value.includes(value)) {
    // This status is currently selected - remove it
    updatedStatuses = selectedStatuses.value.filter(status => status !== value);
  }
  else {
    // This status is not selected - add it
    updatedStatuses = [...selectedStatuses.value, value];
  }

  emits('update:modelValue', updatedStatuses);
  selectedStatuses.value = updatedStatuses;
}

const filteredStatus = computed(() =>
  allRegStatuses.map(status => ({
    color: status.dotClass,
    label: status.label,
    value: status.label,
  })),
);

const buttonLabel = computed(() => {
  // No filter active - show "Status Filter"
  if (selectedStatuses.value.length === 0)
    return 'Status Filter';

  // Single selection - show the status name
  if (selectedStatuses.value.length === 1)
    return selectedStatuses.value[0];

  // Multiple selections - show count
  return `${selectedStatuses.value.length} selected`;
});

// Simplified: Just check if individual status is selected
const isChecked = (value: string) => {
  return selectedStatuses.value.includes(value);
};

// Simplified mobile clear logic
const clearAllSelections = () => {
  emits('update:modelValue', []);
  selectedStatuses.value = [];
};
</script>

<template>
  <div>
    <ClientOnly>
      <!-- Desktop: Original Popover -->
      <Popover v-if="!isMobile">
        <PopoverTrigger as-child>
          <Button variant="outline" class="relative h-[42px] bg-card dark:bg-background">
            <!-- Show status icon when no filter active -->
            <Icon
              v-if="selectedStatuses.length === 0"
              icon="heroicons:flag"
              class="mr-2 size-4 text-slate-600 dark:text-slate-400"
            />
            <!-- Show "Status" label only when there are selections -->
            <span v-if="selectedStatuses.length > 0" class="border-r pr-2 text-xs text-slate-500">Status</span>
            <span class="font-medium" :class="{ 'ml-2': selectedStatuses.length > 0 }">
              {{ buttonLabel }}
            </span>
            <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
            <!-- Show indicator dot only when there are selections -->
            <span
              v-if="selectedStatuses.length > 0"
              class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-full p-0 sm:w-[200px]" align="center">
          <Command>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <!-- Individual Status Options Only -->
                <CommandItem
                  v-for="item in filteredStatus"
                  :key="item.value"
                  :value="item"
                  @select="() => updateValue(item.value)"
                >
                  <div
                    :class="cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isChecked(item.value)
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
        v-else
        variant="outline"
        class="relative h-[42px] w-full bg-card dark:bg-background"
        @click="isSheetOpen = true"
      >
        <!-- Show status icon when no filter active -->
        <Icon
          v-if="selectedStatuses.length === 0"
          icon="heroicons:flag"
          class="mr-2 size-4 text-slate-600 dark:text-slate-400"
        />
        <!-- Show "Status" label only when there are selections -->
        <span v-if="selectedStatuses.length > 0" class="border-r pr-2 text-xs text-slate-500">Status</span>
        <span class="ml-2 font-medium">
          {{ buttonLabel }}
        </span>
        <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
        <!-- Show indicator dot only when there are selections -->
        <span v-if="selectedStatuses.length > 0" class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500" />
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
            <!-- Clear Button - Only show if something is selected -->
            <div v-if="selectedStatuses.length > 0" class="flex items-center justify-center">
              <Button variant="outline" size="sm" @click="clearAllSelections">
                <Icon icon="heroicons:x-mark" class="mr-2 size-4" />
                Clear
              </Button>
            </div>

            <Separator />

            <!-- Status List -->
            <div class="scroll-area max-h-60 space-y-2 overflow-y-auto">
              <!-- Individual Statuses Only -->
              <div
                v-for="status in filteredStatus"
                :key="status.value"
                class="flex items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                :class="{ 'bg-muted/50': isChecked(status.value) }"
                @click="() => updateValue(status.value)"
              >
                <Checkbox
                  :checked="isChecked(status.value)"
                  @click.stop
                  @update:checked="() => updateValue(status.value)"
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
              Apply Filters ({{ selectedStatuses.length === 0 ? 'No filter' : selectedStatuses.length }} selected)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </ClientOnly>
  </div>
</template>
