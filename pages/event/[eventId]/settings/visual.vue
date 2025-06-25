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
const eventId = computed(() => route.params.eventId as string || '');

const { event: eventData, isLoading } = useEvent();

const handleSave = async (formData: any) => {
  try {
    const { $galantisApi } = useNuxtApp();
    await $galantisApi.put(`/event/${eventId.value}/visual`, formData);
    toast.success('Visual settings saved successfully');
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to save settings');
    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
};

useHead({
  title: 'Visual Settings',
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
