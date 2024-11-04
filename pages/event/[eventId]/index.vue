<script setup lang="ts">
import RegCards from '~/components/partials/registrations/RegCards.vue';

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
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-10 mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <h1 class="h2 mb">Dashboard</h1>
    </header>
    <RegCards />
  </div>
</template>
