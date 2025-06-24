<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

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

const selectedTickets = ref<string[]>(props.modelValue);

const getData = async (eventId: Ref<string>, signal: AbortSignal) => {
  const { $galantisApi } = useNuxtApp();
  return $galantisApi
    .get(`/event/${eventId.value}/tickets`, { signal })
    .then((response) => {
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      else {
        return [];
      }
    })
    .catch((error) => {
      console.error('Error fetching tickets:', error);
      return [];
    });
};

const { data: tickets } = useQuery({
  enabled: true,
  queryFn: ({ signal }) => getData(eventId, signal),
  queryKey: ['tickets', eventId],
  staleTime: 1000 * 60 * 5, // 5 minutes
});

watch(
  () => props.modelValue,
  (newValue) => {
    selectedTickets.value = newValue;
  },
);

// Just toggle individual tickets
function updateValue(value: string) {
  let updatedTickets: string[];

  if (selectedTickets.value.includes(value)) {
    // This ticket is currently selected - remove it
    updatedTickets = selectedTickets.value.filter(ticket => ticket !== value);
  }
  else {
    // This ticket is not selected - add it
    updatedTickets = [...selectedTickets.value, value];
  }

  emits('update:modelValue', updatedTickets);
  selectedTickets.value = updatedTickets;
}

const buttonLabel = computed(() => {
  if (!tickets.value || tickets.value.length === 0)
    return 'No Tickets';

  // No filter active - show "Ticket Filter"
  if (selectedTickets.value.length === 0)
    return 'Ticket Filter';

  // Single selection - show the ticket name
  if (selectedTickets.value.length === 1)
    return selectedTickets.value[0];

  // Multiple selections - show count
  return `${selectedTickets.value.length} selected`;
});

// Just check if individual ticket is selected
const isChecked = (value: string) => {
  return selectedTickets.value.includes(value);
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
  return tickets.value && tickets.value.length > 5;
});

const ticketOptions = computed(() => {
  return tickets.value ? tickets.value : [];
});

const filteredTickets = computed(() => {
  if (!searchTerm.value)
    return ticketOptions.value;
  return filterFunction.value(ticketOptions.value, searchTerm.value);
});

// Simplified mobile clear logic
const clearAllSelections = () => {
  emits('update:modelValue', []);
  selectedTickets.value = [];
};
</script>

<template>
  <div>
    <ClientOnly>
      <!-- Desktop: Original Popover -->
      <Popover v-if="!isMobile">
        <PopoverTrigger as-child>
          <Button variant="outline" class="relative h-[42px] bg-card dark:bg-background">
            <!-- Show ticket icon when no filter active -->
            <Icon
              v-if="selectedTickets.length === 0"
              icon="heroicons:ticket"
              class="mr-2 size-4 text-slate-600 dark:text-slate-400"
            />
            <!-- Show "Ticket" label only when there are selections -->
            <span v-if="selectedTickets.length > 0" class="border-r pr-2 text-xs text-slate-500">Ticket</span>
            <span class="truncate font-medium" :class="{ 'ml-2': selectedTickets.length > 0 }">
              {{ buttonLabel }}
            </span>
            <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
            <!-- Show indicator dot only when there are selections -->
            <span
              v-if="selectedTickets.length > 0"
              class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="p-0" align="center">
          <Command :filter-function="filterFunction">
            <CommandInput v-if="showSearch" v-model="searchTerm" placeholder="Search tickets..." />
            <CommandList class="scroll-area">
              <CommandEmpty>No tickets found.</CommandEmpty>
              <CommandGroup>
                <!-- Individual Ticket Options Only -->
                <CommandItem
                  v-for="ticket in filteredTickets"
                  :key="ticket.id"
                  :value="ticket"
                  @select="() => updateValue(ticket.name)"
                >
                  <div
                    :class="cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isChecked(ticket.name)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )"
                  >
                    <Icon icon="radix-icons:check" class="size-4" />
                  </div>
                  <span>{{ ticket.name }}</span>
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
        <!-- Show ticket icon when no filter active -->
        <Icon
          v-if="selectedTickets.length === 0"
          icon="heroicons:ticket"
          class="mr-2 size-4 text-slate-600 dark:text-slate-400"
        />
        <!-- Show "Ticket" label only when there are selections -->
        <span v-if="selectedTickets.length > 0" class="border-r pr-2 text-xs text-slate-500">Ticket</span>
        <span class="ml-2 truncate font-medium">
          {{ buttonLabel }}
        </span>
        <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
        <!-- Show indicator dot only when there are selections -->
        <span v-if="selectedTickets.length > 0" class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500" />
      </Button>

      <!-- Mobile: Sheet/Drawer -->
      <Sheet v-model:open="isSheetOpen">
        <SheetContent side="bottom" class="flex h-full max-h-[70vh] grow flex-col">
          <SheetHeader>
            <SheetTitle>Filter by Tickets</SheetTitle>
            <SheetDescription>
              Select tickets to filter the results
            </SheetDescription>
          </SheetHeader>

          <!-- Search Input (only show if more than 5 tickets) -->
          <div v-if="showSearch" class="relative">
            <Icon
              icon="heroicons:magnifying-glass"
              class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input v-model="searchTerm" placeholder="Search tickets..." class="pl-9" />
          </div>

          <Separator />
          <div class="scroll-area flex-1 space-y-4 overflow-y-auto">
            <!-- Tickets List -->
            <div class="space-y-2">
              <!-- Individual Tickets Only -->
              <template v-if="filteredTickets.length > 0">
                <div
                  v-for="ticket in filteredTickets"
                  :key="ticket.id"
                  class="flex items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                  :class="{ 'bg-muted/50': isChecked(ticket.name) }"
                  @click="() => updateValue(ticket.name)"
                >
                  <Checkbox
                    :checked="isChecked(ticket.name)"
                    @click.stop
                    @update:checked="() => updateValue(ticket.name)"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium">
                      {{ ticket.name }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Empty State -->
              <div
                v-else-if="searchTerm && filteredTickets.length === 0"
                class="py-8 text-center text-sm text-muted-foreground"
              >
                <Icon icon="heroicons:ticket" class="mx-auto mb-2 size-8 opacity-50" />
                <p>No tickets found for "{{ searchTerm }}"</p>
              </div>
            </div>
          </div>

          <SheetFooter class="flex flex-col space-y-4">
            <!-- Clear Button - Only show if something is selected -->
            <div v-if="selectedTickets.length > 0" class="flex items-center justify-center">
              <Button variant="outline" size="sm" @click="clearAllSelections">
                <Icon icon="heroicons:x-mark" class="mr-2 size-4" />
                Clear
              </Button>
            </div>
            <Button class="w-full" @click="isSheetOpen = false">
              Apply Filters ({{ selectedTickets.length === 0 ? 'No filter' : selectedTickets.length }} selected)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </ClientOnly>
  </div>
</template>
