<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue';
import { Icon } from '@iconify/vue';
import { useDebounceFn } from '@vueuse/core';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import SpinnerDots from '@/components/SpinnerDots.vue';
import { cn } from '~/lib/utils';

import EventCover from './EventCover.vue';
import { Button } from './ui/button';
import { Input } from './ui/input';

const router = useRouter();
const authStore = useAuthStore();

const selectedEventId = ref<string | null>(null);
const search = ref<string>(''); // Provide a default value for search
const isDropdownOpen = ref(false);

// Fetch events
const { events, isLoading, error, isError, isRefetching, maxPage, nextPage, page, prevPage, refetch } = useEvents({
  search,
});

// User action to select an event
const handleselectEvent = (newEventId: string) => {
  selectedEventId.value = newEventId;
  router.push(`/event/${newEventId}`);
};

const isSelected = (eventId: string) => {
  return authStore.selectedEvent?.id === eventId;
};

// Handle search with debounce
const debouncedSearch = useDebounceFn((newValue: string) => {
  if (newValue.length > 3) {
    console.warn('Triggering refetch for search');
    page.value = 1;
    refetch();
  }
  else if (newValue.length === 0) {
    console.warn('Triggering refetch for empty search');
    page.value = 1;
    refetch();
  }
  else {
    console.warn('Search length not sufficient, no refetch triggered');
  }
}, 300);

// Function to handle scroll locking
const toggleScrollLock = (lock: boolean) => {
  if (typeof document === 'undefined')
    return;

  if (lock) {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
  }
  else {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
};

watch(search, (newValue) => {
  console.warn('Search value changed:', newValue);
  debouncedSearch(newValue);
});

// Watch for dropdown state changes
watch(isDropdownOpen, (isOpen) => {
  toggleScrollLock(isOpen);
});

// Cleanup on component unmount
onUnmounted(() => {
  toggleScrollLock(false);
});
</script>

<template>
  <div class="group py-1.5 sm:min-w-80 md:w-96">
    <ClientOnly>
      <Listbox v-slot="{ open }" v-model="selectedEventId">
        <div class="relative size-full max-w-full">
          <ListboxButton
            class="relative flex h-11 w-full cursor-default items-center space-x-2 rounded-lg border bg-white text-left text-sm text-slate-900 transition-colors duration-200 hover:border-blue-600 group-focus-within:bg-white dark:border-slate-800 dark:bg-transparent dark:text-slate-300 dark:hover:border-blue-600 dark:focus:bg-slate-800 dark:focus:ring-offset-slate-800 dark:group-focus-within:border-slate-700 dark:group-focus-within:bg-slate-700/40 2xl:text-sm"
          >
            <div v-if="!authStore.selectedEvent" class="flex w-full justify-center px-5 text-xs">
              No event selected
            </div>
            <div
              v-else
              class="flex w-full items-center justify-between space-x-1 pl-4 pr-10 md:pl-2"
            >
              <div class="flex items-center space-x-2 sm:space-x-3">
                <EventCover class="size-6" :src="authStore.selectedEvent?.logo" :title="authStore.selectedEvent?.title" />
                <div class="hidden w-px items-center font-medium leading-tight sm:flex sm:w-auto">
                  <span class="line-clamp-2">{{ authStore.selectedEvent?.title }}</span>
                </div>
              </div>
              <div class="shrink-0">
                <Badge :class="`event-package ${authStore.selectedEvent?.package}`">
                  {{ authStore.selectedEvent?.package }}
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
          </ListboxButton>
        </div>
        <Transition
          enter-to-class="opacity-100"
          enter-active-class="transition duration-100 ease-out"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="open">
            <ListboxOptions
              class="absolute left-0 z-50 mt-2.5 flex h-[calc(100dvh-64px)] w-full flex-col overflow-hidden border bg-white text-sm shadow-lg ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-950 sm:left-auto sm:mt-1 sm:h-auto sm:min-h-min sm:w-96 sm:rounded-lg md:max-h-[calc(100dvh-64px)]"
            >
              <template v-if="isLoading">
                <li class="flex w-full justify-center py-10">
                  <SpinnerDots class="size-10 text-blue-700" />
                </li>
              </template>
              <template v-else-if="isError">
                <li class="flex w-full justify-center py-10">
                  {{ error }}
                </li>
              </template>
              <template v-else-if="events">
                <div
                  class="scroll-area relative grid grow auto-rows-min grid-cols-1 gap-0.5 overflow-y-auto overscroll-y-contain pb-10 sm:pb-4 md:max-h-96"
                >
                  <div class="pointer-events-none sticky top-0 z-10">
                    <div class="pointer-events-auto relative bg-white px-2 py-3 dark:bg-slate-950">
                      <div class="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">
                        <SpinnerDots v-if="isRefetching" class="size-5 text-slate-400 dark:text-slate-500" />
                        <Icon
                          v-else
                          class="size-5 text-slate-400 dark:text-slate-500"
                          icon="tabler:search"
                        />
                      </div>
                      <Input
                        v-model="search"
                        type="search"
                        class="h-8 border-b border-slate-200 px-2 pl-10 dark:border-slate-700"
                        placeholder="Search events..."
                      />
                    </div>
                    <div class="h-3 bg-gradient-to-b from-white dark:from-slate-950" />
                  </div>
                  <ul v-if="events.length > 0" class="-mt-4 flex flex-col gap-1 px-2">
                    <ListboxOption
                      v-for="evt in events"
                      :key="evt.id"
                      :value="evt"
                      as="li"
                      class="flex w-full cursor-default select-none items-center space-x-2 rounded-md px-3 py-2 text-slate-700 dark:text-slate-300"
                      :class="[
                        isSelected(evt.id)
                          ? 'bg-emerald-100 dark:bg-emerald-900/40'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-900/80',
                      ]"
                      @click="handleselectEvent(evt.id)"
                    >
                      <template v-if="isLoading">
                        <SpinnerDots class="mx-auto size-10 text-blue-50" />
                      </template>
                      <template v-else-if="evt">
                        <EventCover :src="evt?.logo" :title="evt.title" />
                        <p
                          class="line-clamp-2 pr-5 leading-tight"
                          :class="[isSelected(evt.id) ? 'font-bold' : 'font-medium']"
                        >
                          {{ evt.title }}
                        </p>
                        <span
                          v-if="isSelected(evt.id)"
                          class="absolute right-5 flex size-2.5 items-center rounded-full bg-emerald-400"
                        />
                      </template>
                    </ListboxOption>
                  </ul>
                  <div v-else class="flex w-full justify-center py-10">
                    No events found
                  </div>
                </div>
                <template v-if="events.length > 0">
                  <div
                    class="pointer-events-none absolute bottom-12 z-20 h-20 w-full bg-gradient-to-t from-white dark:from-slate-950 sm:hidden"
                  />
                  <div
                    class="flex h-12 w-full shrink-0 items-center justify-end border-t border-slate-200 p-3 dark:border-slate-800 sm:col-span-2"
                  >
                    <div class="flex space-x-px">
                      <Button
                        v-if="page > 1"
                        variant="ghost"
                        size="icon"
                        :class="cn('rounded-l-md', { 'text-slate-500': page === 1 })"
                        @click="prevPage"
                      >
                        <Icon class="size-4" icon="tabler:chevrons-left" />
                      </Button>
                      <Button
                        v-if="page < maxPage"
                        variant="ghost"
                        size="icon"
                        :class="cn('rounded-l-md', { 'text-slate-500': page === 1 })"
                        @click="nextPage"
                      >
                        <Icon class="size-4" icon="tabler:chevrons-right" />
                      </Button>
                    </div>
                  </div>
                </template>
              </template>
              <template v-else>
                <li class="flex w-full justify-center py-10">
                  No events found
                </li>
              </template>
            </ListboxOptions>
          </div>
        </Transition>
      </Listbox>
    </ClientOnly>
  </div>
</template>

<style lang="scss" scoped>
.listbox {
  @apply relative rounded-md flex w-full cursor-default select-none items-center space-x-2 px-3 py-3 text-slate-700 dark:text-slate-300;
}
</style>
