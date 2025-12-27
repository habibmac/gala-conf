<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const props = defineProps<{
  modelValue: string[]
}>();

const emits = defineEmits(['update:modelValue']);

// Responsive breakpoint detection
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => !breakpoints.md.value);

// Sheet state for mobile
const isSheetOpen = ref(false);

const route = useRoute();

const eventId = computed(() => {
  const param = route.params.eventId;
  return Array.isArray(param) ? param[0] : param || '';
});

const selectedReviewers = ref<string[]>(props.modelValue);

// Get reviewers data
const { getReviewers, loading } = useReviewers(eventId.value);
const reviewers = ref<any[]>([]);

onMounted(async () => {
  try {
    reviewers.value = await getReviewers();
  } catch (error) {
    console.error('Error fetching reviewers:', error);
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    selectedReviewers.value = newValue;
  },
);

// Toggle individual reviewers
function updateValue(value: string) {
  let updatedReviewers: string[];

  if (selectedReviewers.value.includes(value)) {
    // This reviewer is currently selected - remove it
    updatedReviewers = selectedReviewers.value.filter(reviewer => reviewer !== value);
  }
  else {
    // This reviewer is not selected - add it
    updatedReviewers = [...selectedReviewers.value, value];
  }

  emits('update:modelValue', updatedReviewers);
  selectedReviewers.value = updatedReviewers;
}

const buttonLabel = computed(() => {
  if (!reviewers.value || reviewers.value.length === 0)
    return 'No Reviewers';

  // No filter active - show "Reviewer Filter"
  if (selectedReviewers.value.length === 0)
    return 'Reviewer Filter';

  // Single selection - show the reviewer name
  if (selectedReviewers.value.length === 1) {
    const reviewer = reviewers.value.find(r => r.user_id === selectedReviewers.value[0]);
    return reviewer ? reviewer.name : selectedReviewers.value[0];
  }

  // Multiple selections - show count
  return `${selectedReviewers.value.length} selected`;
});

// Check if individual reviewer is selected
const isChecked = (value: string) => {
  return selectedReviewers.value.includes(value);
};

const searchTerm = ref('');

const filterFunction = computed(() => {
  return (val: string[] | Record<string, any>[] | number[] | false[] | true[], term: string): string[] | Record<string, any>[] | number[] | false[] | true[] => {
    if (!val)
      return [];
    return (val as Record<string, any>[]).filter(
      item => item && item.name && typeof item.name === 'string' && item.name.toLowerCase().includes(term.toLowerCase()),
    );
  };
});

const showSearch = computed(() => {
  return reviewers.value && reviewers.value.length > 5;
});

const reviewerOptions = computed(() => {
  return reviewers.value ? reviewers.value : [];
});

const filteredReviewers = computed(() => {
  if (!searchTerm.value)
    return reviewerOptions.value;
  return filterFunction.value(reviewerOptions.value, searchTerm.value);
});

// Clear all selections
const clearAllSelections = () => {
  emits('update:modelValue', []);
  selectedReviewers.value = [];
};
</script>

<template>
  <div>
    <ClientOnly>
      <!-- Desktop: Original Popover -->
      <Popover v-if="!isMobile">
        <PopoverTrigger as-child>
          <Button variant="outline" class="relative h-[42px] bg-card dark:bg-background">
            <!-- Show reviewer icon when no filter active -->
            <Icon
              v-if="selectedReviewers.length === 0"
              icon="heroicons:user-group"
              class="mr-2 size-4 text-slate-600 dark:text-slate-400"
            />
            <!-- Show "Reviewer" label only when there are selections -->
            <span v-if="selectedReviewers.length > 0" class="border-r pr-2 text-xs text-slate-500">Reviewer</span>
            <span class="truncate font-medium" :class="{ 'ml-2': selectedReviewers.length > 0 }">
              {{ buttonLabel }}
            </span>
            <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
            <!-- Show indicator dot only when there are selections -->
            <span
              v-if="selectedReviewers.length > 0"
              class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="p-0 w-80" align="center">
          <Command :filter-function="filterFunction">
            <CommandInput v-if="showSearch" v-model="searchTerm" placeholder="Search reviewers..." />
            <CommandList class="scroll-area">
              <CommandEmpty>No reviewers found.</CommandEmpty>
              <CommandGroup>
                <!-- Individual Reviewer Options -->
                <CommandItem
                  v-for="reviewer in filteredReviewers"
                  :key="reviewer.user_id"
                  :value="reviewer"
                  @select="() => updateValue(reviewer.user_id)"
                >
                  <div
                    :class="cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isChecked(reviewer.user_id)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )"
                  >
                    <Icon icon="radix-icons:check" class="size-4" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-medium">{{ reviewer.name }}</span>
                    <span class="text-xs text-muted-foreground">{{ reviewer.email }}</span>
                  </div>
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
        <!-- Show reviewer icon when no filter active -->
        <Icon
          v-if="selectedReviewers.length === 0"
          icon="heroicons:user-group"
          class="mr-2 size-4 text-slate-600 dark:text-slate-400"
        />
        <!-- Show "Reviewer" label only when there are selections -->
        <span v-if="selectedReviewers.length > 0" class="border-r pr-2 text-xs text-slate-500">Reviewer</span>
        <span class="ml-2 truncate font-medium">
          {{ buttonLabel }}
        </span>
        <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
        <!-- Show indicator dot only when there are selections -->
        <span v-if="selectedReviewers.length > 0" class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500" />
      </Button>

      <!-- Mobile: Sheet/Drawer -->
      <Sheet v-model:open="isSheetOpen">
        <SheetContent side="bottom" class="flex h-full max-h-[70vh] grow flex-col">
          <SheetHeader>
            <SheetTitle>Filter by Reviewers</SheetTitle>
            <SheetDescription>
              Select reviewers to filter the results
            </SheetDescription>
          </SheetHeader>

          <!-- Search Input (only show if more than 5 reviewers) -->
          <div v-if="showSearch" class="relative">
            <Icon
              icon="heroicons:magnifying-glass"
              class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input v-model="searchTerm" placeholder="Search reviewers..." class="pl-9" />
          </div>

          <Separator />
          <div class="scroll-area flex-1 space-y-4 overflow-y-auto">
            <!-- Reviewers List -->
            <div class="space-y-2">
              <!-- Individual Reviewers -->
              <template v-if="filteredReviewers.length > 0">
                <div
                  v-for="reviewer in filteredReviewers"
                  :key="reviewer.user_id"
                  class="flex items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                  :class="{ 'bg-muted/50': isChecked(reviewer.user_id) }"
                  @click="() => updateValue(reviewer.user_id)"
                >
                  <Checkbox
                    :checked="isChecked(reviewer.user_id)"
                    @click.stop
                    @update:checked="() => updateValue(reviewer.user_id)"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium">
                      {{ reviewer.name }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ reviewer.email }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Empty State -->
              <div
                v-else-if="searchTerm && filteredReviewers.length === 0"
                class="py-8 text-center text-sm text-muted-foreground"
              >
                <Icon icon="heroicons:user-group" class="mx-auto mb-2 size-8 opacity-50" />
                <p>No reviewers found for "{{ searchTerm }}"</p>
              </div>
            </div>
          </div>

          <SheetFooter class="flex flex-col space-y-4">
            <!-- Clear Button - Only show if something is selected -->
            <div v-if="selectedReviewers.length > 0" class="flex items-center justify-center">
              <Button variant="outline" size="sm" @click="clearAllSelections">
                <Icon icon="heroicons:x-mark" class="mr-2 size-4" />
                Clear
              </Button>
            </div>
            <Button class="w-full" @click="isSheetOpen = false">
              Apply Filters ({{ selectedReviewers.length === 0 ? 'No filter' : selectedReviewers.length }} selected)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </ClientOnly>
  </div>
</template>
