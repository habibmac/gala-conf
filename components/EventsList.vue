<!-- components/EventsList.vue -->
<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Skeleton } from '@/components/ui/skeleton';

const props = defineProps({
  status: {
    required: true,
    type: String,
    validator: (value: string) => ['active', 'past'].includes(value),
  },
});

const route = useRoute();
const router = useRouter();

const currentPage = computed(() => Number(route.query.page) || 1);
const evtStatus = computed(() => (props.status === 'past' ? 'inactive' : 'active'));

const { events, isError, isLoading, isRefetching, pagination, refetch } = useEvents({
  evtStatus,
  page: currentPage,
});

watch(
  [() => props.status, currentPage],
  () => {
    refetch();
  },
  { immediate: true },
);

const updatePage = (page: number) => {
  router.push({
    query: {
      ...route.query,
      page: page === 1 ? undefined : page.toString(),
    },
  });
};

// Reset page when status changes
watch(
  () => props.status,
  () => {
    updatePage(1);
  },
);
</script>

<template>
  <div v-if="isLoading || isRefetching" class="grid h-full grid-cols-1 gap-6">
    <Skeleton class="mx-auto h-80 w-full max-w-xs bg-muted-foreground/10 sm:h-32 sm:max-w-none" />
  </div>
  <template v-else-if="isError">
    <EmptyState
      title="An error occurred"
      description="We couldn't load your events. Please try again later."
      :img="{ src: '/images/empty-state/no-event.svg', alt: 'Error' }"
      :cta2="{
        icon: 'heroicons:arrow-path-solid',
        label: 'Refresh',
        action: refetch,
      }"
    />
  </template>
  <div v-else-if="events" class="mb-20">
    <div v-if="events.length > 0" class="flex flex-col gap-6">
      <!-- Events -->
      <div v-for="event in events" :key="event.id" class="grid grid-cols-1">
        <EventCard :event="event" :is-past="evtStatus === 'inactive'" />
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="pagination && pagination.total_pages > 1"
        :total-pages="pagination.total_pages"
        :current-page="currentPage"
        @update:page="updatePage"
      />
    </div>
    <EmptyState
      v-else
      :title="evtStatus === 'active' ? 'No Active Events' : 'No Past Events'"
      :description="evtStatus === 'active' ? 'You have no active events. Create one now!' : 'You have no past events.'"
      :cta2="{
        icon: 'heroicons:plus',
        iconClass: 'w-5 h-5',
        label: 'Create Event',
        to: '/new-event',
      }"
    />
  </div>
  <template v-else>
    <EmptyState
      title="No data found"
      :img="{
        src: '/images/empty-state/no-data.svg',
        class: 'w-32',
        alt: 'No data found',
      }"
    />
  </template>
</template>
