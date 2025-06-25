<script setup lang="ts">
import { toast } from 'vue-sonner';

import TicketSettings from '~/components/partials/settings/TicketSettings.vue';

definePageMeta({
  capabilities: ['ee_edit_events'],
  group: 'admin',
  icon: 'solar:ticket-bold-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer'],
  showInMenu: true,
  title: 'Tickets',
  order: 4,
  isSubMenu: true,
  parentPath: '/event/:eventId/settings',
});

const { event: eventData, isLoading, refetch: refreshEvent } = useEvent();

const handleSave = async (_formData: any) => {
  try {
    toast.success('Ticket settings saved successfully');
    await refreshEvent();
  }
  catch (error: unknown) {
    console.warn('Error in ticket settings save callback:', error);
    toast.error('Failed to refresh event data');
  }
};

useHead({
  title: 'Ticket Settings',
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
              Ticket Settings
            </h1>
            <p class="mb-5 text-muted-foreground">
              Configure ticket types, pricing, and availability for your event.
            </p>
          </header>

          <TicketSettings :event-data="eventData" :is-loading="isLoading" @save="handleSave" />
        </section>
      </div>
    </div>
  </div>
</template>
