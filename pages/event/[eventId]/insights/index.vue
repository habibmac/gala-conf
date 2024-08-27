<script setup lang="ts">
definePageMeta({
  title: "Insights",
  group: "reports",
  showInMenu: true,
  order: 2,
  icon: "solar:layers-bold-duotone",
  packages: ["optima"],
  roles: ["administrator", "ee_event_organizer"],
  capabilities: ["ee_read_insights"],
  permissions: ["ee_read_insights"],
  layout: "dashboard-with-sidebar",
});
</script>
<template>
  <div>
    <h1>Insights</h1>
  </div>
</template>
