<script setup lang="ts">
import confetti from 'canvas-confetti';

import CheckinStats from '~/components/partials/checkins/CheckinStats.vue';
import EventCountdown from '~/components/partials/dashboard/EventCountdown.vue';
import EventPackage from '~/components/partials/dashboard/EventPackage.vue';
import EventTimeline from '~/components/partials/dashboard/EventTimeline.vue';
import RecentRegistrations from '~/components/partials/dashboard/RecentRegistrations.vue';
import SessionsCapacity from '~/components/partials/dashboard/SessionsCapacity.vue';
import TicketsCapacity from '~/components/partials/dashboard/TicketsCapacity.vue';
import TransactionChart from '~/components/partials/dashboard/TransactionChart.vue';
import RegCards from '~/components/partials/registrations/RegCards.vue';
import SeatBookings from '~/components/partials/registrations/SeatBookings.vue';

useHead({
  title: 'Dashboard',
});

definePageMeta({
  capabilities: ['ee_read_registrations'],
  group: 'dashboard',
  icon: 'solar:widget-4-bold-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Dashboard',
});

const { hasEventEnded, hasSeating } = useEventStatus();

const triggerConfetti = () => {
  // Since we're importing confetti directly, use it directly
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
};

onMounted(() => {
  if (hasEventEnded.value) {
    setTimeout(() => {
      triggerConfetti();
    }, 1000);
  }
});
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="mb-5 flex flex-col gap-2 pt-10 sm:flex-row sm:items-start sm:justify-between">
      <h1 class="h2 mb">
        Dashboard
      </h1>
    </header>
    <div class="mb-40 flex flex-col gap-4">
      <ClientOnly>
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 items-start gap-4 sm:grid-cols-12">
            <RegCards class="sm:col-span-12 md:col-span-6" :for-dashboard="true" />
            <EventCountdown class="sm:col-span-6 md:col-span-3" />
            <EventTimeline class="sm:col-span-6 md:col-span-3" />
            <EventPackage v-if="!hasEventEnded" class="sm:col-span-6 md:col-span-3" />
            <TransactionChart v-if="!hasEventEnded" class="sm:col-span-9" />
            <div class="space-y-4 sm:col-span-6">
              <SessionsCapacity />
              <TicketsCapacity />
            </div>
            <RecentRegistrations class="sm:col-span-6" />
          </div>
        </div>
        <CheckinStats :show-detailed-stats="false" :show-recent-checkins="true" />
        <SeatBookings v-if="hasSeating" />
      </ClientOnly>
    </div>
  </div>
</template>
