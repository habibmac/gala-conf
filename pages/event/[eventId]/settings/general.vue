<script setup lang="ts">
import { toast } from 'vue-sonner';

import GeneralSettings from '~/components/partials/settings/GeneralSettings.vue';

definePageMeta({
  capabilities: ['ee_edit_events'],
  group: 'admin',
  icon: 'solar:settings-bold-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer'],
  showInMenu: true,
  title: 'General',
  order: 1,
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
    toast.success('General settings saved successfully');
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to save settings');
    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
};

useHead({
  title: 'General Settings',
});
</script>

<template>
  <div class="relative flex h-full flex-col md:flex-row">
    <SubmenuSidebar />
    <div class="flex-1 overflow-y-auto">
      <div class="container mx-auto mb-20 p-6 2xl:mx-0">
        <section>
          <header class="pt-10">
            <h1 class="h2">
              General Settings
            </h1>
            <p class="mb-5 text-muted-foreground">
              Configure basic event information
            </p>
          </header>
          <GeneralSettings :event-data="eventData" :is-loading="isLoading" @save="handleSave" />
        </section>
      </div>
    </div>
  </div>
</template>
