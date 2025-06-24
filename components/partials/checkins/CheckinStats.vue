<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { GlobalCheckinStats, StatsCard } from '~/types';

import { formatThousands } from '@/utils';
import Card from '~/components/ui/card/Card.vue';

const props = withDefaults(
  defineProps<{
    eventId: string
    datetimeFilter?: string
  }>(),
  {
    datetimeFilter: '',
  },
);

const { hasEventEnded } = useEventStatus();

// Fetch stats
const { $galantisApi } = useNuxtApp();
const getStats = async (evtId: string, datetimeFilter: string): Promise<GlobalCheckinStats> => {
  const params: Record<string, string> = {};
  if (datetimeFilter) {
    params.datetime_id = datetimeFilter;
  }

  const response = await $galantisApi.get(`/event/${evtId}/checkins/stats`, {
    params,
  });
  return response.data;
};

// Use reactive query
const {
  data: stats,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ['checkin-stats', props.eventId, computed(() => props.datetimeFilter)],
  queryFn: () => getStats(props.eventId, props.datetimeFilter),
  enabled: computed(() => !!props.eventId),
  staleTime: 1000 * 60 * 2, // 2 minutes
});

// Helper function for safe percentage calculation
const safePercentage = (numerator: number, denominator: number): string => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return '0';
  }

  const percentage = (numerator / denominator) * 100;
  const cappedPercentage = Math.min(100, Math.max(0, percentage));

  return Number.isFinite(cappedPercentage) ? cappedPercentage.toFixed(0) : '0';
};

// Computed values for stats
const checkinStats = computed(() => stats.value || {
  total_checkins: 0,
  unique_checkins: 0,
  total_registrations: 0,
  percentage: 0,
  total_checkouts: 0,
  currently_present: 0,
});

// Individual stat values
const totalRegs = computed(() => checkinStats.value.total_registrations || 0);
const totalCheckins = computed(() => checkinStats.value.unique_checkins || 0);
const totalCheckouts = computed(() => checkinStats.value.total_checkouts || 0);
const currentlyPresent = computed(() => checkinStats.value.currently_present || 0);

// Safe percentage calculations
const percentageCheckins = computed(() =>
  safePercentage(totalCheckins.value, totalRegs.value),
);

// Stats cards configuration
const statsCards = computed((): StatsCard[] => [
  {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    color: 'text-blue-500',
    icon: 'solar:users-group-rounded-linear',
    title: 'Total Registrations',
    value: totalRegs.value,
  },
  {
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    color: 'text-green-500',
    icon: 'solar:login-2-linear',
    percentage: percentageCheckins.value,
    title: 'Total Check-ins',
    value: totalCheckins.value,
  },
  {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    color: 'text-orange-500',
    icon: 'solar:users-group-rounded-linear',
    percentage: safePercentage(currentlyPresent.value, totalRegs.value),
    title: 'Currently Present',
    value: currentlyPresent.value,
  },
  {
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    color: 'text-red-500',
    icon: 'solar:logout-2-linear',
    percentage: safePercentage(totalCheckouts.value, totalRegs.value),
    title: 'Total Check-outs',
    value: totalCheckouts.value,
  },
]);
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card v-for="i in 4" :key="i">
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="shrink-0">
              <Skeleton class="size-10 rounded-lg" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <Skeleton class="mb-2 h-4 w-20" />
              <Skeleton class="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Error State -->
    <div v-else-if="isError" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <Icon icon="heroicons:exclamation-triangle" class="size-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            Error loading check-in statistics
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error?.message || 'Unable to load statistics. Please try again.' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card v-for="card in statsCards" :key="card.title">
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="shrink-0">
              <div :class="`rounded-lg p-3 ${card.bgColor}`">
                <Icon :icon="card.icon" :class="`h-6 w-6 ${card.color}`" />
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-muted-foreground">
                  {{ card.title }}
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold tracking-tight text-foreground">
                    {{ formatThousands(card.value) }}
                  </div>
                  <div v-if="card.percentage" class="ml-2 flex items-baseline text-sm font-semibold">
                    <span :class="`${card.color}`">
                      {{ card.percentage }}%
                    </span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Event Ended Banner -->
    <div v-if="hasEventEnded && !isLoading" class="rounded-md border border-yellow-200 bg-yellow-50 p-4">
      <div class="flex">
        <Icon icon="heroicons:information-circle" class="size-5 text-yellow-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">
            Event has ended
          </h3>
          <div class="mt-2 text-sm text-yellow-700">
            <p>This event has concluded. The statistics shown are final.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
