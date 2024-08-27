<script setup lang="ts">import { useRouter } from "vue-router";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import EventCover from "./EventCover.vue";
import SpinnerDots from "@/components/SpinnerDots.vue";
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import { useDebounceFn } from '@vueuse/core';

const router = useRouter();
const selectedEventId = ref<string | null>(null);
const search = ref<string>(""); // Provide a default value for search

// Fetch events
const { event, isLoading, isError, error } = useEvent();
const { events, page, maxPage, prevPage, nextPage, refetch, isRefetching } = useEvents({
  search,
});

// User action to select an event
const handleselectEvent = (newEventId: string) => {
  selectedEventId.value = newEventId;
  router.push(`/event/${newEventId}`);
};

const isSelected = (eventId: string) => {
  return event?.value.id === eventId;
};

// Handle search with debounce
const debouncedSearch = useDebounceFn((newValue: string) => {
  if (newValue.length > 3) {
    console.log('Triggering refetch for search');
    page.value = 1;
    refetch();
  } else if (newValue.length === 0) {
    console.log('Triggering refetch for empty search');
    page.value = 1;
    refetch();
  } else {
    console.log('Search length not sufficient, no refetch triggered');
  }
}, 300);

watch(search, (newValue) => {
  console.log('Search value changed:', newValue);
  debouncedSearch(newValue);
});
</script>
<template>
  <div class="py-1.5 sm:min-w-80 md:w-96 group">
    <Listbox v-model="selectedEventId" v-slot="{ open }">
      <div class="relative h-full w-full max-w-full">
        <ListboxButton
          class="relative rounded-md group-focus-within:bg-white dark:group-focus-within:bg-slate-700/40 flex h-14 w-full cursor-default items-center space-x-2 border bg-white text-left text-sm text-slate-900 transition-colors duration-200 hover:border-blue-600 2xl:text-sm dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:border-blue-600 dark:group-focus-within:border-slate-700 dark:focus:bg-slate-800 dark:focus:bg-slate-700/30 dark:focus:ring-offset-slate-800"
          :class="{ 'rounded-t': open, rounded: !open }"
        >
          <div v-if="isLoading" class="flex w-full justify-center px-5">
            <SpinnerDots class="h-10 w-10 text-blue-700" />
          </div>
          <div
            v-else-if="isError"
            class="flex w-auto text-xs justify-center px-5"
          >
            ⚠️ Cannot fetch events, please try again later.
          </div>
          <div
            v-else-if="event"
            class="flex w-full items-center justify-between space-x-1 pl-4 md:pl-2 pr-10"
          >
            <div class="flex grow items-center space-x-2 sm:space-x-3">
              <EventCover
                :src="event.logo"
                :title="event.title"
                class="h-10 w-10"
              />
              <div
                class="flex items-center font-medium leading-tight w-px sm:w-auto"
              >
                <span class="line-clamp-2">{{ event.title }}</span>
              </div>
            </div>
            <div class="shrink-0">
              <Badge :class="`event-package ${event.package}`">{{
                event.package
              }}</Badge>
            </div>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex shrink-0 items-center pr-2"
            >
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
        </ListboxButton>
      </div>
      <Transition
        enter-to-class="opacity-100"
        enter-active-class="transition duration-100 ease-out"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute left-0 mt-0 sm:mt-1 w-full flex h-[calc(100dvh-64px)] md:max-h-[calc(100dvh-64px)] md:w-auto flex-col border bg-white text-sm shadow-lg ring-black/5 focus:outline-none sm:left-auto sm:h-auto sm:min-h-min sm:w-96 sm:rounded-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <template v-if="isLoading">
            <li class="flex w-full justify-center py-10">
              <SpinnerDots class="h-10 w-10 text-blue-700" />
            </li>
          </template>

          <template v-else-if="isError">
            <li class="flex w-full justify-center py-10">
              {{ error }}
            </li>
          </template>

          <template v-else-if="events">
            <div
              class="no-scrollbar relative grid grow auto-rows-min grid-cols-1 overflow-y-auto overscroll-y-contain gap-0.5 pb-10 sm:pb-4 md:max-h-96 scroll-area"
            >
              <div class="sticky z-10 top-0 pointer-events-none">
                <div
                  class="p-3 bg-white dark:bg-slate-800 relative pointer-events-auto"
                >
                  <div  class="absolute top-1/2 -translate-y-1/2 left-6 pointer-events-none">
                    <SpinnerDots v-if="isRefetching" class="h-7 w-7 text-slate-400 dark:text-slate-500" />
                  <Icon v-else class="h-5 w-5 text-slate-400 dark:text-slate-500" icon="heroicons-outline:search" />
                  </div>
                  <Input
                    type="search"
                    class="h-10 px-4 pl-12 border-b border-slate-200 dark:border-slate-700"
                    placeholder="Search events..."
                    v-model="search"
                  />
                </div>
                <div
                  class="h-8 bg-gradient-to-b from-white dark:from-slate-800"
                ></div>
              </div>

              <ul class="-mt-6" v-if="events.length > 0">
                <ListboxOption
                  :key="event.id"
                  :value="event"
                  v-for="event in events"
                  as="li"
                  :class="[
                    isSelected(event.id)
                      ? 'bg-emerald-100 dark:bg-emerald-900/40'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-900/80',
                    'rounded-md flex w-full cursor-default select-none items-center space-x-2 px-3 py-3 text-slate-700 dark:text-slate-300',
                  ]"
                  @click="handleselectEvent(event.id)"
                >
                  <template v-if="isLoading">
                    <SpinnerDots class="mx-auto h-10 w-10 text-blue-50" />
                  </template>
                  <template v-else-if="event">
                    <EventCover
                      :src="event?.logo"
                      :title="event.title"
                      class="h-10 w-10 relative shrink-0 overflow-hidden rounded-sm bg-blue-900/20"
                    />
                    <p
                      :class="[
                        isSelected(event.id) ? 'font-bold' : 'font-medium',
                        'line-clamp-2 pr-5 leading-tight',
                      ]"
                    >
                      {{ event.title }}
                    </p>
                    <span
                      v-if="isSelected(event.id)"
                      class="absolute right-5 flex h-2.5 w-2.5 items-center rounded-full bg-emerald-400"
                    >
                    </span>
                  </template>
                </ListboxOption>
              </ul>
              <div
                v-else
                class="flex w-full justify-center py-10"
              >
                No events found
                </div>
            </div>
            <div
              class="pointer-events-none absolute bottom-12 z-20 h-20 w-full bg-gradient-to-t from-white sm:hidden dark:from-slate-800"
            ></div>
            <div
              class="flex h-12 w-full shrink-0 items-center justify-end border-t border-slate-200 p-3 sm:col-span-2 dark:border-slate-700"
            >
              <div class="flex space-x-px">
                <Button
                  variant="ghost"
                  size="icon"
                  v-if="page > 1"
                  @click="prevPage"
                  :class="cn('rounded-l-md', { 'text-slate-500': page === 1 })"
                >
                  <svg class="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M14.121 17.243a.997.997 0 0 1-.707-.293l-4.242-4.243a1 1 0 0 1 0-1.414l4.242-4.243a1 1 0 0 1 1.414 1.414L11.293 12l3.535 3.536a1 1 0 0 1-.707 1.707"
                    />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  v-if="page < maxPage"
                  @click="nextPage"
                  :class="cn('rounded-l-md', { 'text-slate-500': page === 1 })"
                >
                  <svg class="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M9.879 17.243a1 1 0 0 1-.707-1.707L12.707 12L9.172 8.464a1 1 0 0 1 1.414-1.414l4.242 4.243a1 1 0 0 1 0 1.414l-4.242 4.243a.997.997 0 0 1-.707.293"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </template>
          <template v-else>
            <li class="flex w-full justify-center py-10">
              No events found
            </li>
            </template>
        </ListboxOptions>
      </Transition>
    </Listbox>
  </div>
</template>
<style lang="scss" scoped>
.listbox {
  @apply relative rounded-md flex w-full cursor-default select-none items-center space-x-2 px-3 py-3 text-slate-700 dark:text-slate-300;
}
</style>
