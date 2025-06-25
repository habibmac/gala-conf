<script setup lang="ts">
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

const { event: eventData } = useEvent();

const handleSave = async () => {
  // Do nothing
};

useHead({
  title: 'General Settings',
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
              General Settings
            </h1>
            <p class="mb-5 text-muted-foreground">
              Configure basic event information
            </p>
          </header>
          <GeneralSettings :event-data="eventData" @save="handleSave" />
        </section>
      </div>
    </div>
  </div>
</template>
