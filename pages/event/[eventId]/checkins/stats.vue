<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

import CheckinCustomStats from '~/components/partials/checkins/CheckinCustomStats.vue';
import CheckinStats from '~/components/partials/checkins/CheckinStats.vue';
import CheckinTabs from '~/components/partials/checkins/CheckinTabs.vue';
import CheckinTicketStats from '~/components/partials/checkins/CheckinTicketStats.vue';
import { useDatetimes } from '~/composables/useDatetimes';

const props = withDefaults(
  defineProps<{
    datetime?: string // Add datetime prop
  }>(),
  {
    datetime: '', // Default to empty (all sessions)
  },
);

useHead({
  title: 'Check-ins - Stats',
});

definePageMeta({
  capabilities: ['ee_read_checkins'],
  group: 'tools',
  icon: 'solar:bill-check-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 1,
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: false, // Don't show in menu since it's a sub-page
  title: 'Check-ins - Stats',
});

const route = useRoute();
const router = useRouter();
const eventId = ref<string>(route.params.eventId as string);

// Add datetime filter using the composable
const {
  datetimes,
  selectedDatetime,
  selectedDatetimeInfo,
  setSelectedDatetime,
  isLoading: isDatetimesLoading,
} = useDatetimes(eventId);

// Initialize datetime from URL
onMounted(() => {
  if (props.datetime) {
    setSelectedDatetime(props.datetime);
  }
});

// Handle datetime filter change
const handleDatetimeChange = (datetimeId: string) => {
  setSelectedDatetime(datetimeId); // This automatically updates filters.datetime

  // Update URL
  const query = { ...route.query, datetime: datetimeId || undefined };
  if (!datetimeId) {
    delete query.datetime;
  }
  router.push({ query });
};
</script>

<template>
  <div class="container mx-auto flex flex-col gap-5">
    <div class="flex flex-col">
      <header class="mb-5 flex flex-col gap-2 pt-10 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex items-center justify-between gap-4">
          <h1 class="h2">
            Check-ins
          </h1>
          <CheckinTabs />
        </div>

        <!-- Use the new component -->
        <DropdownDatetimeFilter
          :datetimes="datetimes"
          :selected-datetime="selectedDatetime"
          :is-loading="isDatetimesLoading"
          @update:selected-datetime="handleDatetimeChange"
        />
      </header>

      <!-- Alert info -->
      <Card v-if="selectedDatetimeInfo" class="mb-4 border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/50">
        <CardContent class="pt-6">
          <div class="flex items-start space-x-4">
            <div class="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <Icon icon="solar:calendar-mark-bold-duotone" class="size-6 text-blue-600" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-blue-700 dark:text-blue-300">
                Showing check-ins for
                <span v-if="selectedDatetimeInfo" class="font-bold">{{ selectedDatetimeInfo.name }}</span>
                <span v-else class="font-bold">all sessions</span>
              </h3>
              <p class="mt-1 text-sm text-blue-600 dark:text-blue-400">
                {{ formatDateRange(selectedDatetimeInfo.date_start, selectedDatetimeInfo.date_end) }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Pass datetime filter to CheckinStats -->
      <CheckinStats :event-id="eventId" :datetime-filter="selectedDatetime" />
    </div>
  </div>

  <div class="container mx-auto mb-20">
    <section class="space-y-4">
      <div class="mx-auto">
        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- Enhanced Ticket Stats -->
          <CheckinTicketStats :event-id="eventId" :datetime-filter="selectedDatetime" />
          <!-- Custom Field Stats -->
          <CheckinCustomStats :event-id="eventId" :datetime-filter="selectedDatetime" />
        </div>
      </div>
    </section>
  </div>
</template>
