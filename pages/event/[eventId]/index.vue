<script setup lang="ts">
import CheckinStats from '~/components/partials/checkins/CheckinStats.vue';
import RegCards from '~/components/partials/registrations/RegCards.vue';
import CongratulationsBanner from '~/components/CongratulationsBanner.vue';
import SeatBookings from '~/components/partials/registrations/SeatBookings.vue';

useHead({
  title: 'Dashboard',
});

definePageMeta({
  title: 'Dashboard',
  group: 'dashboard',
  showInMenu: true,
  icon: 'solar:widget-4-bold-duotone',
  requiresSelectedEvent: true,
  packages: ['starter', 'smart', 'optima'],
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  capabilities: ['ee_read_registrations'],
  layout: 'dashboard-with-sidebar',
});

const { hasEventEnded, hasSeating } = useEventStatus();

// Function to trigger confetti
const triggerConfetti = () => {
  useConfetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
};

onMounted(() => {
  if (hasEventEnded.value) {
    //wait for 1 second before triggering confetti
    setTimeout(() => {
      triggerConfetti();
    }, 1000);
  }
});
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-10 mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <h1 class="h2 mb">Dashboard</h1>
    </header>
    <div class="flex flex-col gap-4 mb-40">
      <ClientOnly>
        <CongratulationsBanner v-if="hasEventEnded" />
        <RegCards v-else />
        <CheckinStats :show-detailed-stats="false" :show-recent-checkins="true" />

        <SeatBookings v-if="hasSeating" />
      </ClientOnly>
    </div>
  </div>
</template>
