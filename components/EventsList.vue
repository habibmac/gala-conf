<!-- components/EventsList.vue -->
<script setup lang="ts">
import { computed, watch } from "vue";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value: string) => ["active", "past"].includes(value),
  },
});

const route = useRoute();
const router = useRouter();

const currentPage = computed(() => Number(route.query.page) || 1);
const evtStatus = computed(() =>
  props.status === "past" ? "inactive" : "active"
);

const { events, isLoading, isError, pagination, refetch, isRefetching } = useEvents({
  evtStatus,
  page: currentPage,
});

watch(
  [() => props.status, currentPage],
  () => {
    refetch();
  },
  { immediate: true }
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
  }
);
</script>

<template>
  <div v-if="isLoading || isRefetching" class="grid h-full grid-cols-1 gap-6">
    <Skeleton class="h-80 w-full sm:h-32 max-w-xs sm:max-w-none mx-auto" />
  </div>
  <template v-else-if="isError">
    <div class="flex h-32 items-center justify-center">
      Error fetching events. Please try again later.
    </div>
  </template>
  <template v-else>
    <div class="flex flex-col gap-6" v-if="events && events.length > 0">
      <!-- Events -->
      <div v-for="event in events" :key="event.id" class="grid grid-cols-1">
        <EventCard :event="event" :isPast="evtStatus === 'inactive'" />
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
      :description="
        evtStatus === 'active'
          ? 'You have no active events. Create one now!'
          : 'You have no past events.'
      "
      :cta="{
        label: 'Create Event',
        to: { name: 'new-event' },
      }"
    />
  </template>
</template>
