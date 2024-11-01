<script setup lang="ts">
import EventCover from '@/components/EventCover.vue';
import { devImgPath } from '~/utils';
import { cn } from '~/lib/utils';

defineProps({
  event: {
    type: Object,
    required: true,
  },
  class: {
    type: String,
    default: '',
  },
  isPast: {
    type: Boolean,
    default: false,
  },
});
</script>
<template>
  <NuxtLink
    :to="`/event/${event.id}`"
    class="relative mx-auto flex flex-col max-w-xs sm:max-w-none overflow-hidden rounded-lg border border-border bg-card dark:bg-slate-900 hover:border-primary transition w-full sm:flex-row group"
  >
    <!-- Image -->
    <div class="relative flex items-center justify-center w-full sm:w-44 overflow-hidden md:shrink-0 mx-auto p-3">
      <EventCover
        :class="
          cn(
            'scale-125 absolute transition-transform duration-200 group-hover:scale-150 group-hover:blur-lg inset-0 w-full h-full blur-xl opacity-25 dark:opacity-45 object-cover',
            'z-0'
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
        <div class="text-xs text-muted-foreground">{{ event.start }} - {{ event.end }}</div>
        <h3
          class="font-semibold leading-snug tracking-tight"
          :class="[isPast ? 'line-clamp-2 text-lg' : 'line-clamp-3 text-2xl']"
        >
          {{ event.title }}
        </h3>
        <div class="">
          <Badge :class="`event-package ${event.package}`">{{ event.package }}</Badge>
        </div>
      </div>
      <!-- Footer -->
      <div v-if="!isPast" class="mt-3 flex flex-col items-center justify-between space-x-4 sm:flex-row">
        <!-- Location -->
        <div
          class="hidden items-center rounded-full px-2.5 py-1 text-center text-xs font-medium sm:inline-flex bg-accent text-accent-foreground/70"
        >
          <span class="line-clamp-1" v-if="event.location">{{ event.location }}</span>
          <span v-else>---</span>
        </div>
      </div>
    </div>

    <div
      class="order-1 flex shrink-0 flex-col items-center justify-center space-x-2 border-t p-4 text-center sm:w-1/5 sm:border-none"
    >
      <div class="number lining-nums" :class="[isPast ? 'text-xl' : 'text-3xl text-green-500 ']">
        {{ event.regs }}
      </div>
      <div class="text-muted-foreground" :class="[isPast ? 'text-xs' : 'text-sm']">Regs</div>
    </div>
  </NuxtLink>
</template>
