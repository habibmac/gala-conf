<!-- pages/event/[eventId]/settings/sessions.vue -->
<script setup lang="ts">
import { toast } from 'vue-sonner';

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
  order: 2,
  isSubMenu: true,
  parentPath: '/event/:eventId/settings',
});

const route = useRoute();
const eventId = route.params.eventId as string;

const { event: eventData, isLoading } = useEvent();

const { $galantisApi } = useNuxtApp();

const handleSave = async (formData: any) => {
  try {
    await $galantisApi.put(`/event/${eventId}`, formData);
    toast.success('Session settings saved successfully');
  }
  catch (error: unknown) {
    console.warn('Error saving session settings:', error);
    toast.error('Failed to save settings');
  }
};

useHead({
  title: 'Session Settings',
});
</script>

<template>
  <div class="flex h-full">
    <SubmenuSidebar />
    <div class="flex-1 overflow-y-auto">
      <div class="container mx-auto p-6 2xl:mx-0">
        <section>
          <header class="pt-10">
            <h1 class="h2">
              Session Settings
            </h1>
            <p class="mb-5 text-muted-foreground">
              Configure session dates, times, and other related settings for your event.
            </p>
          </header>
          <DatetimeSettings :event-data="eventData" :is-loading="isLoading" @save="handleSave" />
        </section>
      </div>
    </div>
  </div>
</template>
