<script setup lang="ts">
import { toast } from 'vue-sonner';

import VisualSettings from '~/components/partials/settings/VisualSettings.vue';

definePageMeta({
  capabilities: ['ee_edit_events'],
  group: 'admin',
  icon: 'solar:palette-bold-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer'],
  showInMenu: true,
  title: 'Visual',
  order: 3,
  isSubMenu: true,
  parentPath: '/event/:eventId/settings',
});

const route = useRoute();
const eventId = route.params.eventId as string;

const { event: eventData, isLoading } = useEvent();

const handleSave = async (formData: any) => {
  try {
    const { $galantisApi } = useNuxtApp();
    await $galantisApi.put(`/event/${eventId}/visual`, formData);
    toast.success('Visual settings saved successfully');
  }
  catch (error: unknown) {
    console.warn('Error saving visual settings:', error);
    toast.error('Failed to save settings');
  }
};

useHead({
  title: 'Visual Settings',
});
</script>

<template>
  <div class="relative flex h-full">
    <SubmenuSidebar />
    <div class="flex-1 overflow-y-auto">
      <div class="container mx-auto mb-20 p-6 2xl:mx-0">
        <section>
          <header class="pt-10">
            <h1 class="h2">
              Visual Settings
            </h1>
            <p class="mb-5 text-muted-foreground">
              Customize the visual appearance and gallery for your event
            </p>
          </header>
          <VisualSettings :event-data="eventData" :is-loading="isLoading" @save="handleSave" />
        </section>
      </div>
    </div>
  </div>
</template>
