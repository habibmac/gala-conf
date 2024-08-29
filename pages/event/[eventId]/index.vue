<script setup lang="ts">
import RegCards from "~/components/partials/registrations/RegCards.vue";

definePageMeta({
  title: "Dashboard",
  group: "dashboard",
  showInMenu: true,
  requiresSelectedEvent: true,
  icon: "solar:widget-4-bold-duotone",
  packages: ["starter", "smart", "optima"],
  roles: ["administrator", "ee_event_organizer", "ee_event_operator"],
  capabilities: ["ee_read_registrations"],
  permissions: ["ee_read_registrations"],
  layout: "dashboard-with-sidebar",
});
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-10">
      <h1 class="h2 mb-5">Dashboard</h1>
    </header>
    <RegCards />
  </div>
</template>
