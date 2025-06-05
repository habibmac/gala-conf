<!-- components/checkins/CheckinStats.vue -->
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { CheckinStats } from '~/types';

import { formatThousands } from '@/utils';
import Card from '~/components/ui/card/Card.vue';

import CheckinDistributions from './CheckinDistributions.vue';
import CheckinRecent from './CheckinRecent.vue';

withDefaults(
  defineProps<{
    showTotalRegs?: boolean
    showDetailedStats?: boolean
    showRecentCheckins?: boolean
  }>(),
  {
    showDetailedStats: true,
    showRecentCheckins: false,
    showTotalRegs: true,
  },
);

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');
const { hasEventEnded } = useEventStatus();

// Fetch stats
const { $galantisApi } = useNuxtApp();

const getStats = async (evtId: Ref) => {
  const response = await $galantisApi.get(`/event/${evtId.value}/checkins/stats`);
  return response.data;
};

const {
  data: stats,
  isLoading,
  isRefetching,
} = useQuery<CheckinStats>({
  queryFn: () => getStats(eventId),
  queryKey: ['checkin-stats', eventId],
  refetchInterval: hasEventEnded.value ? false : 30000,
  staleTime: hasEventEnded.value ? Infinity : 30000,
});

const totalRegs = computed(() =>
  stats.value?.global.total_registrations ? formatThousands(stats.value.global.total_registrations) : 0,
);

const totalCheckins = computed(() =>
  stats.value?.global.total_checkins ? formatThousands(stats.value.global.total_checkins) : 0,
);
const percentageCheckins = computed(
  () => ((stats.value?.global.total_checkins ?? 0) / (stats.value?.global.total_registrations ?? 1)) * 100,
);

const totalRemaining = computed(() =>
  stats.value?.global.total_registrations
    ? formatThousands(
        Number.parseInt((stats.value?.global.total_registrations ?? 0).toString())
        - Number.parseInt((stats.value?.global.total_checkins ?? 0).toString()),
      )
    : 0,
);

const percentageRemaining = computed(
  () => Number.parseInt(totalRemaining.value.toString()) / (stats.value?.global.total_registrations ?? 1) * 100,
);

const totalCheckouts = computed(() =>
  stats.value?.global.total_checkouts ? formatThousands(stats.value.global.total_checkouts) : 0,
);
const percentageCheckouts = computed(
  () => ((stats.value?.global.total_checkouts ?? 0) / (stats.value?.global.total_registrations ?? 1)) * 100,
);

const statsCards = computed(() => [
  // if showTotalRegs
  {
    bgColor: 'bg-blue-50',
    color: 'text-blue-500',
    icon: 'solar:users-group-rounded-linear',
    title: 'Total Registrations',
    value: totalRegs.value,
  },
  {
    bgColor: 'bg-green-50',
    color: 'text-green-500',
    icon: 'solar:login-2-linear',
    percentage: percentageCheckins.value.toFixed(0),
    title: 'Total Check-ins',
    value: totalCheckins.value,
  },
  {
    bgColor: 'bg-red-50',
    color: 'text-red-500',
    icon: 'solar:users-group-rounded-linear',
    percentage: percentageRemaining.value.toFixed(0),
    title: 'Remaining',
    value: totalRemaining.value,
  },
  {
    bgColor: 'bg-orange-50',
    color: 'text-orange-500',
    icon: 'solar:logout-2-linear',
    percentage: percentageCheckouts.value.toFixed(0),
    title: 'Total Check-outs',
    value: totalCheckouts.value,
  },
]);
</script>

<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card
      v-for="(card, index) in statsCards"
      :key="index"
      class="relative rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <!-- Card Header -->
      <CardTitle class="text-sm font-medium tracking-normal">
        {{ card.title }}
      </CardTitle>

      <!-- Card Value -->
      <div class="flex items-end justify-between">
        <div>
          <div class="text-2xl font-bold text-slate-800 dark:text-white">
            <template v-if="isLoading || isRefetching">
              <Skeleton class="h-8 w-16" />
            </template>
            <template v-else>
              {{ card.value.toLocaleString() }}
            </template>
          </div>
        </div>
      </div>

      <!-- Trend Indicator -->
      <div v-if="card.percentage" class="flex items-center text-sm font-medium" :class="card.color">
        <span class="mr-1">{{ card.percentage }}%</span>
      </div>
    </Card>

    <div v-if="stats && showRecentCheckins" class="col-span-2 lg:col-span-4">
      <CheckinRecent />
    </div>

    <div v-if="stats && showDetailedStats" class="col-span-2 lg:col-span-4">
      <CheckinDistributions :tickets="stats.tickets" :custom="stats.custom" />
    </div>
  </div>
</template>
