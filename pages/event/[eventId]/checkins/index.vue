<script setup lang="ts">
import SpinnerRing from '~/components/SpinnerRing.vue';

definePageMeta({
  capabilities: ['ee_read_checkins'],
  group: 'tools',
  icon: 'solar:bill-check-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 1,
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Check-ins',
});

const route = useRoute();

// Redirect to check-ins stats
await navigateTo(`/event/${route.params.eventId}/checkins/stats`, { replace: true });
</script>

<template>
  <div class="flex min-h-[200px] items-center justify-center">
    <div class="text-center">
      <SpinnerRing class="mx-auto mt-4" />
      <p class="mt-2 text-muted-foreground">
        Redirecting to check-ins stats...
      </p>
    </div>
  </div>
</template>
