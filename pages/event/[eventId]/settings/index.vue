<script setup lang="ts">
definePageMeta({
  capabilities: ['ee_edit_events'],
  group: 'admin',
  icon: 'solar:settings-bold-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer'],
  showInMenu: true,
  title: 'Settings',
  order: 10,
});

const route = useRoute();

// Redirect to general settings by default
await navigateTo(`/event/${route.params.eventId}/settings/general`, { replace: true });
</script>

<template>
  <div class="flex min-h-[200px] items-center justify-center">
    <div class="text-center">
      <div class="mx-auto size-8 animate-spin rounded-full border-b-2 border-primary" />
      <p class="mt-2 text-muted-foreground">
        Redirecting to settings...
      </p>
    </div>
  </div>
</template>
