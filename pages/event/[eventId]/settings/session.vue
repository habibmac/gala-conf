<script setup lang="ts">
import DatetimeSettings from '~/components/partials/settings/DatetimeSettings.vue';

definePageMeta({
  capabilities: ['ee_edit_events'],
  group: 'admin',
  icon: 'solar:calendar-bold-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer'],
  showInMenu: true,
  title: 'Sessions',
  order: 3,
  isSubMenu: true,
  parentPath: '/event/:eventId/settings',
});

const { event: eventData, isLoading } = useEvent();

useHead({
  title: 'Session Settings',
});
</script>

<template>
  <div class="container relative mx-auto flex h-full flex-col md:flex-row">
    <SubmenuSidebar />
    <div class="flex-1 overflow-y-auto">
      <div class="container mx-auto mb-20 p-0 sm:p-6 2xl:mx-0">
        <section>
          <header class="pt-10">
            <h1 class="h2">
              Session Settings
            </h1>
            <p class="mb-5 text-muted-foreground">
              Configure session dates, times, and other related settings for your event.
            </p>
          </header>
          <DatetimeSettings :event-data="eventData" :is-loading="isLoading" />
        </section>
      </div>
    </div>
  </div>
</template>
