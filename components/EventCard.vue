<script setup lang="ts">
import EventCover from '@/components/EventCover.vue';
import { formatDateRange } from '@/utils';
import { cn } from '~/lib/utils';

defineProps({
  class: {
    default: '',
    type: String,
  },
  event: {
    required: true,
    type: Object,
  },
  isPast: {
    default: false,
    type: Boolean,
  },
});
</script>

<template>
  <NuxtLink
    :to="`/event/${event.id}`"
    class="group relative mx-auto flex w-full max-w-xs flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary dark:bg-slate-900 sm:max-w-none sm:flex-row"
  >
    <!-- <PulseDot v-if="!isPast" class="absolute top-2 right-2 rounded-full z-20" dot-class="size-2.5 bg-green-400" pulse-class="bg-green-300 size-4" /> -->

    <!-- Image -->
    <div class="relative mx-auto flex w-full items-center justify-center overflow-hidden p-3 sm:w-44 md:shrink-0">
      <EventCover
        :class="
          cn(
            'scale-125 absolute transition-transform duration-200 group-hover:scale-150 group-hover:blur-lg inset-0 w-full h-full blur-xl opacity-25 dark:opacity-45 object-cover',
            'z-0',
          )
        "
        :title="event.title"
        :src="event.logo"
      />
      <EventCover :class="cn(isPast ? 'h-32 w-32' : 'h-40 w-40', 'z-10')" :title="event.title" :src="event.logo" />
    </div>

    <!-- Content -->
    <div class="flex grow flex-col p-5 text-center sm:text-left">
      <div class="grow">
        <div class="text-xs text-muted-foreground">
          {{ formatDateRange(event.date_start, event.date_end) }}
        </div>
        <h3
          class="font-semibold leading-snug tracking-tight"
          :class="[isPast ? 'line-clamp-2 text-lg' : 'line-clamp-3 text-2xl']"
        >
          {{ event.title }}
        </h3>
        <div class="">
          <Badge :class="`event-package ${event.package}`">
            {{ event.package }}
          </Badge>
        </div>
      </div>
      <!-- Footer -->
      <div v-if="!isPast" class="mt-3 flex flex-col items-center justify-between space-x-4 sm:flex-row">
        <!-- Location -->
        <div
          class="hidden items-center rounded-full bg-accent px-2.5 py-1 text-center text-xs font-medium text-accent-foreground/70 sm:inline-flex"
        >
          <span v-if="event.location" class="line-clamp-1">{{ event.location }}</span>
          <span v-else>---</span>
        </div>
      </div>
    </div>

    <div
      class="order-1 flex shrink-0 flex-col items-center justify-center space-x-2 border-t p-4 text-center sm:w-1/5 sm:border-none"
    >
      <div class="ordinal slashed-zero lining-nums" :class="[isPast ? 'text-xl' : 'text-3xl text-green-500 ']">
        {{ event.regs }}
      </div>
      <div class="font-medium text-muted-foreground" :class="[isPast ? 'text-xs' : 'text-sm']">
        Regs
      </div>
    </div>
  </NuxtLink>
</template>
