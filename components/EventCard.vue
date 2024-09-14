<script setup lang="ts">
import EventCover from "@/components/EventCover.vue";

defineProps({
  event: {
    type: Object,
    required: true,
  },
  class: {
    type: String,
    default: "",
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
    class="relative mx-auto flex flex-col max-w-xs sm:max-w-none overflow-hidden rounded-lg border border-border bg-card hover:border-secondary transition w-full sm:flex-row"
  >
    <!-- Image -->
    <EventCover
      class="relative mx-auto inline-block w-full max-w-40 shrink-0 p-3 sm:block"
      :class="[isPast ? 'sm:h-32 sm:w-32' : 'sm:h-40 sm:w-40']"
      :title="event.title"
      :src="event.logo"
    />

    <!-- Content -->
    <div class="flex grow flex-col p-5 text-center sm:text-left">
      <div class="grow">
        <div class="text-xs text-muted-foreground">
          {{ event.start }} - {{ event.end }}
        </div>
        <h3
          class="font-semibold leading-snug tracking-tight"
          :class="[isPast ? 'line-clamp-2 text-lg' : 'line-clamp-3 text-2xl']"
        >
          {{ event.title }}
        </h3>
        <div class="">
          <Badge :class="`event-package ${event.package}`">{{
            event.package
          }}</Badge>
        </div>
      </div>
      <!-- Footer -->
      <div
        v-if="!isPast"
        class="mt-3 flex flex-col items-center justify-between space-x-4 sm:flex-row"
      >
        <!-- Location -->
        <div
          class="hidden items-center rounded-full px-2.5 py-1 text-center text-xs font-medium sm:inline-flex bg-accent text-accent-foreground/70"
        >
          <span class="line-clamp-1" v-if="event.location">{{
            event.location
          }}</span>
          <span v-else>---</span>
        </div>
      </div>
    </div>

    <div
      class="order-1 flex shrink-0 flex-col items-center justify-center space-x-2 border-t p-4 text-center sm:w-1/5 sm:border-none"
    >
      <div
        class="number lining-nums"
        :class="[
          isPast
            ? 'text-xl'
            : 'text-3xl text-green-500 ',
        ]"
      >
        {{ event.regs }}
      </div>
      <div
        class="text-muted-foreground"
        :class="[isPast ? 'text-xs' : 'text-sm']"
      >
        Regs
      </div>
    </div>
  </NuxtLink>
</template>
