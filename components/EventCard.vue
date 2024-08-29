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
    class="relative mx-auto flex flex-col max-w-xs sm:max-w-none overflow-hidden rounded-lg border border-white bg-white transition hover:shadow-lg hover:ring-2 hover:ring-blue-600 w-full sm:flex-row dark:border-slate-900 dark:bg-slate-900 dark:hover:ring-blue-600"
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
        <div class="text-xs font-medium uppercase text-slate-400">
          {{ event.start }} - {{ event.end }}
        </div>
        <h3
          class="font-semibold leading-snug tracking-tight text-slate-800 dark:text-slate-100"
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
          class="hidden items-center rounded-full bg-slate-100 px-2.5 py-1 text-center text-xs font-medium text-slate-600 sm:inline-flex dark:bg-slate-700 dark:text-slate-400"
        >
          <span class="line-clamp-1" v-if="event.location">{{
            event.location
          }}</span>
          <span v-else>---</span>
        </div>
      </div>
    </div>

    <div
      class="order-1 flex shrink-0 flex-col items-center justify-center space-x-2 border-t from-white p-4 text-center sm:w-1/5 sm:border-none dark:border-slate-700"
    >
      <div
        class="number lining-nums"
        :class="[
          isPast
            ? 'text-xl text-slate-900 dark:text-slate-300'
            : 'text-3xl text-green-500 ',
        ]"
      >
        {{ event.regs }}
      </div>
      <div
        class="text-slate-500 dark:text-slate-400"
        :class="[isPast ? 'text-xs' : 'text-sm']"
      >
        Regs
      </div>
    </div>
  </NuxtLink>
</template>
