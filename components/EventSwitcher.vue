<script setup lang="ts">
import { ref } from 'vue';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import Badge from './ui/badge/Badge.vue';

const router = useRouter();
const selectedEventId = ref<string | null>(null);

// Fetch events
const { event, isLoading } = useEvent();
const { events } = useEvents();

// User action to select an event
const handleselectEvent = (newEventId: string) => {
  selectedEventId.value = newEventId;
  router.push(`/event/${newEventId}`);
};

const open = ref(false);
</script>

<template>
  <div class="relative w-full sm:min-w-80 md:w-96">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded="open"
          aria-label="Select an event"
          :class="cn('w-full relative h-12 text-left font-normal', !event && 'text-muted-foreground')"
        >
          <div v-if="isLoading" class="flex w-full justify-center px-5">
            <SpinnerDots class="size-10 text-blue-700" />
          </div>
          <div v-else-if="event" class="flex w-full items-center justify-between space-x-1 pr-10">
            <div class="flex grow items-center space-x-2 sm:space-x-3">
              <EventCover :src="event.logo" :title="event.title" class="h-8" />
              <div class="flex w-px items-center font-medium leading-tight sm:w-auto">
                <span class="line-clamp-2">{{ event.title }}</span>
              </div>
            </div>
            <div class="shrink-0">
              <Badge :class="`event-package ${event.package}`">
                {{ event.package }}
              </Badge>
            </div>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex shrink-0 items-center pr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-5 transition"
                :class="[open ? 'rotate-180' : '']"
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
      <PopoverContent class="w-full p-0 sm:min-w-80 md:max-w-96">
        <Command v-model:open="open">
          <CommandList>
            <CommandInput placeholder="Search event..." />
            <CommandEmpty>No event found.</CommandEmpty>
            <CommandItem v-for="i in events" :key="i.id" :value="i.id" @click="handleselectEvent(i.id)">
              <div class="flex items-center space-x-2">
                <EventCover :src="i.logo" :title="i.title" class="h-8" />
                <div class="grow">
                  <span class="line-clamp-2">{{ i.title }}</span>
                </div>
                <Badge :class="`event-package ${i.package}`">
                  {{ i.package }}
                </Badge>
              </div>
            </CommandItem>
          </CommandList>
          <CommandSeparator />
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>
