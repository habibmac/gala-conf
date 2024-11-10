<script setup lang="ts">
import { ref } from 'vue';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Badge from './ui/badge/Badge.vue';

const groups = [
  {
    label: 'Personal Account',
    teams: [
      {
        label: 'Alicia Koch',
        value: 'personal',
      },
    ],
  },
  {
    label: 'Teams',
    teams: [
      {
        label: 'Acme Inc.',
        value: 'acme-inc',
      },
      {
        label: 'Monsters Inc.',
        value: 'monsters',
      },
    ],
  },
];

type Team = (typeof groups)[number]['teams'][number];

const router = useRouter();
const selectedEventId = ref<string | null>(null);

// Fetch events
const { event, isLoading, isError, error } = useEvent();
const { events, page, maxPage, prevPage, nextPage } = useEvents();

// User action to select an event
const handleselectEvent = (newEventId: string) => {
  selectedEventId.value = newEventId;
  router.push(`/event/${newEventId}`);
};

const isSelected = (eventId: string) => {
  return event?.value.id === eventId;
};

const open = ref(false);
</script>

<template>
  <div class="w-full relative sm:min-w-80 md:w-96">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded="open"
          aria-label="Select an event"
          :class="
            cn('w-full relative h-12 text-left font-normal', !event && 'text-muted-foreground')
          "
        >
          <div v-if="isLoading" class="flex w-full justify-center px-5">
            <SpinnerDots class="h-10 w-10 text-blue-700" />
          </div>
          <div v-else-if="event" class="flex w-full items-center justify-between space-x-1 pr-10">
            <div class="flex grow items-center space-x-2 sm:space-x-3">
              <EventCover :src="event.logo" :title="event.title" class="h-8" />
              <div class="flex items-center font-medium leading-tight w-px sm:w-auto">
                <span class="line-clamp-2">{{ event.title }}</span>
              </div>
            </div>
            <div class="shrink-0">
              <Badge :class="`event-package ${event.package}`">{{ event.package }}</Badge>
            </div>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex shrink-0 items-center pr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 transition"
                :class="[open ? 'rotate-180 transform' : '']"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  fill-rule="evenodd"
                  d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0 sm:min-w-80 md:max-w-96 w-full">
        <Command v-model:open="open">
          <CommandList>
            <CommandInput placeholder="Search event..." />
            <CommandEmpty>No event found.</CommandEmpty>
            <CommandItem v-for="i in events" :key="i.id" :value="i.id" @click="handleselectEvent(i.id)">
              <div class="flex items-center space-x-2">
                <EventCover :src="i.logo" :title="i.title" class="h-8" />
                <div class="flex-grow">
                  <span class="line-clamp-2">{{ i.title }}</span>
                </div>
                <Badge :class="`event-package ${i.package}`">{{ i.package }}</Badge>
              </div>
            </CommandItem>
          </CommandList>
          <CommandSeparator />
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>
