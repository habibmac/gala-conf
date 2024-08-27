<script setup lang="ts">
definePageMeta({
  title: "Barcode Scanner",
  group: "tools",
  showInMenu: true,
  order: 1,
  icon: "solar:qr-code-bold-duotone",
  packages: ["optima"],
  roles: ["administrator", "ee_event_organizer"],
  capabilities: ["ee_read_insights"],
  permissions: ["ee_read_insights"],
  layout: "dashboard-with-sidebar",
});
</script>
<template>
  <div>
    <h1>Barcode Scanner</h1>
  </div>
</template>
