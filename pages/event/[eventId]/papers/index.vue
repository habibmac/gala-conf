<script setup lang="ts">
definePageMeta({
  group: 'conf',
  icon: 'solar:notebook-bookmark-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 1,
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: false,
  title: 'Papers',
  redirect: (to) => {
    return `/event/${to.params.eventId}/papers/submissions${to.fullPath.includes('?') ? to.fullPath.substring(to.fullPath.indexOf('?')) : ''}`;
  },
});
</script>

<template>
  <div />
</template>
