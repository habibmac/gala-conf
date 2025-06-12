<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import type { TicketList } from '~/types';

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

const router = useRouter();

const eventId = ref<string>(
  Array.isArray(router.currentRoute.value.params.eventId)
    ? router.currentRoute.value.params.eventId[0]
    : router.currentRoute.value.params.eventId || '',
);

const selectedTickets = ref<string[]>(props.modelValue);

// Keep the exact same API logic
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

function updateValue(value: string) {
  let updatedTickets: string[];

  // If we're currently in "All Tickets" state (empty array)
  if (selectedTickets.value.length === 0) {
    // User is unchecking one item from "All Tickets"
    // So we need all tickets EXCEPT the one being unchecked
    updatedTickets = ticketOptions.value
      .map((ticket: TicketList) => ticket.name)
      .filter((ticketName: string) => ticketName !== value);
  }
  else {
    // Normal toggle behavior when in partial selection
    if (selectedTickets.value.includes(value)) {
      // Removing a ticket
      updatedTickets = selectedTickets.value.filter(ticket => ticket !== value);
    }
    else {
      // Adding a ticket
      updatedTickets = [...selectedTickets.value, value];

      // Check if we now have all tickets selected
      if (updatedTickets.length === ticketOptions.value.length) {
        // Convert to "All Tickets" (empty array)
        updatedTickets = [];
      }
    }
  }

  emits('update:modelValue', updatedTickets);
  selectedTickets.value = updatedTickets;
}

const buttonLabel = computed(() => {
  if (!tickets.value || tickets.value.length === 0)
    return 'No Tickets';

  // When no specific tickets are selected = "All Tickets"
  if (selectedTickets.value.length === 0)
    return 'All Tickets';
  // When all individual tickets are explicitly selected = "All Tickets"
  if (selectedTickets.value.length === tickets.value.length)
    return 'All Tickets';
  // Single selection
  if (selectedTickets.value.length === 1)
    return selectedTickets.value[0];
  // Multiple but not all
  return `${selectedTickets.value.length} tickets selected`;
});

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

function clearAllTickets() {
  emits('update:modelValue', []);
  selectedTickets.value = [];
}

// Mobile-specific functions
const shouldShowSelectAll = computed(() => {
  // Show "Select All" when some but not all tickets are selected
  return selectedTickets.value.length > 0 && selectedTickets.value.length < (tickets.value?.length || 0);
});

const toggleAllSelection = () => {
  if (shouldShowSelectAll.value) {
    // User wants to select all -> set to empty array (which means "All Tickets")
    emits('update:modelValue', []);
    selectedTickets.value = [];
  }
  else {
    // Currently showing "All Tickets", user wants partial selection
    // Select just the first ticket to move to partial selection state
    if (filteredTickets.value.length > 0) {
      const firstTicket = [filteredTickets.value[0].name];
      emits('update:modelValue', firstTicket);
      selectedTickets.value = firstTicket;
    }
  }
};

const toggleTicketMobile = (ticketName: string) => {
  updateValue(ticketName);
};

const isTicketSelected = (ticketName: string) => {
  return selectedTickets.value.includes(ticketName);
};

const isAllTicketsSelected = computed(() => {
  // "All Tickets" is selected when array is empty OR when all individual tickets are selected
  return selectedTickets.value.length === 0 || selectedTickets.value.length === (tickets.value?.length || 0);
});
</script>

<template>
  <div>
    <ClientOnly>
      <!-- Desktop: Original Popover -->
      <Popover v-if="!isMobile">
        <PopoverTrigger as-child>
          <Button variant="outline" class="relative h-[42px] bg-card dark:bg-background">
            <!-- Only show "Ticket" label and indicator when partial selection -->
            <span
              v-if="selectedTickets.length > 0 && selectedTickets.length < (tickets?.length || 0)"
              class="border-r pr-2 text-xs text-slate-500"
            >Ticket</span>
            <span class="ml-2 truncate font-medium">
              {{ buttonLabel }}
            </span>
            <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
            <span
              v-if="selectedTickets.length > 0 && selectedTickets.length < (tickets?.length || 0)"
              class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="p-0" align="center">
          <Command :filter-function="filterFunction">
            <CommandInput v-if="showSearch" v-model="searchTerm" placeholder="Search tickets..." />
            <CommandList>
              <CommandEmpty>No tickets found.</CommandEmpty>
              <CommandGroup>
                <CommandItem :value="{ label: 'All Tickets', value: '' }" @select="clearAllTickets">
                  <div
                    :class="cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isAllTicketsSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )"
                  >
                    <Icon icon="radix-icons:check" class="size-4" />
                  </div>
                  <span>All Tickets</span>
                </CommandItem>
                <CommandItem
                  v-for="ticket in filteredTickets"
                  :key="ticket.id"
                  :value="ticket"
                  @select="() => updateValue(ticket.name)"
                >
                  <div
                    :class="cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selectedTickets.includes(ticket.name) || isAllTicketsSelected
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
        <!-- Only show "Ticket" label and indicator when partial selection -->
        <span
          v-if="selectedTickets.length > 0 && selectedTickets.length < (tickets?.length || 0)"
          class="border-r pr-2 text-xs text-slate-500"
        >Ticket</span>
        <span class="ml-2 truncate font-medium">
          {{ buttonLabel }}
        </span>
        <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
        <span
          v-if="selectedTickets.length > 0 && selectedTickets.length < (tickets?.length || 0)"
          class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500"
        />
      </Button>

      <!-- Mobile: Sheet/Drawer -->
      <Sheet v-model:open="isSheetOpen">
        <SheetContent side="bottom" class="flex h-full max-h-[70vh] grow flex-col overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter by Tickets</SheetTitle>
            <SheetDescription>
              Select tickets to filter the results
            </SheetDescription>
          </SheetHeader>

          <div class="mt-6 flex-1 space-y-4">
            <!-- Search Input (only show if more than 5 tickets) -->
            <div v-if="showSearch" class="relative">
              <Icon
                icon="heroicons:magnifying-glass"
                class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input v-model="searchTerm" placeholder="Search tickets..." class="pl-9" />
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                :disabled="!tickets || tickets.length === 0"
                @click="toggleAllSelection"
              >
                <Icon :icon="shouldShowSelectAll ? 'heroicons:check' : 'heroicons:x-mark'" class="mr-2 size-4" />
                {{ shouldShowSelectAll ? 'Select All' : 'Clear Selection' }}
              </Button>
            </div>

            <Separator />

            <!-- Tickets List -->
            <div class="space-y-2 overflow-y-auto">
              <!-- Individual Tickets -->
              <template v-if="filteredTickets.length > 0">
                <div
                  v-for="ticket in filteredTickets"
                  :key="ticket.id"
                  class="flex items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                  :class="{ 'bg-muted/50': isAllTicketsSelected || isTicketSelected(ticket.name) }"
                  @click="toggleTicketMobile(ticket.name)"
                >
                  <Checkbox
                    :checked="isAllTicketsSelected || isTicketSelected(ticket.name)"
                    :disabled="selectedTickets.length === 1 && isTicketSelected(ticket.name)"
                    @click.stop
                    @update:checked="toggleTicketMobile(ticket.name)"
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

          <SheetFooter class="mt-6">
            <Button class="w-full" @click="isSheetOpen = false">
              Apply Filters ({{ selectedTickets.length === 0 ? 'All' : selectedTickets.length }} selected)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </ClientOnly>
  </div>
</template>
