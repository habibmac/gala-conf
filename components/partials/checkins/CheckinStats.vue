<!-- components/checkins/CheckinStats.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import type { CheckinStats } from '~/types';
import { formatThousands } from '@/utils';
import CheckinDistributions from './CheckinDistributions.vue';
import Card from '~/components/ui/card/Card.vue';

const props = defineProps<{
  showTotalRegs?: boolean;
}>();

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');

// Fetch stats
const { $galantisApi } = useNuxtApp();

const getStats = async (evtId: Ref) => {
  const response = await $galantisApi.get(`/event/${evtId.value}/checkins/stats`);
  return response.data;
};

const { data: stats, isLoading } = useQuery<CheckinStats>({
  queryKey: ['checkin-stats', eventId],
  queryFn: () => getStats(eventId),
  retry: 1,
  refetchInterval: 30000, // Refetch every 30 seconds
});

const statsCards = computed(() => [
  // if showTotalRegs
  {
    title: 'Total Registrations',
    value: stats.value?.global.total_registrations ? formatThousands(stats.value.global.total_registrations) : 0,
    icon: 'solar:users-group-rounded-linear',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Total Check-ins',
    value: stats.value?.global.total_checkins ? formatThousands(stats.value.global.total_checkins) : 0,
    icon: 'solar:login-2-linear',
    color: 'text-green-500',
    percentage: ((stats.value?.global.total_checkins ?? 0) / (stats.value?.global.total_registrations ?? 1)) * 100,
    bgColor: 'bg-green-50',
  },
  {
    title: 'Remaining',
    value:
      parseInt((stats.value?.global.total_registrations ?? 0).toString()) -
      parseInt((stats.value?.global.total_checkins ?? 0).toString()),
    icon: 'solar:users-group-rounded-linear',
    color: 'text-red-500',
    percentage:
      ((parseInt((stats.value?.global.total_registrations ?? 0).toString()) -
        parseInt((stats.value?.global.total_checkins ?? 0).toString())) /
        (stats.value?.global.total_registrations ?? 1)) *
      100,
    bgColor: 'bg-red-50',
  },
  {
    title: 'Total Check-outs',
    value: stats.value?.global.total_checkouts ? formatThousands(stats.value.global.total_checkouts) : 0,
    icon: 'solar:logout-2-linear',
    color: 'text-orange-500',
    percentage: ((stats.value?.global.total_checkouts ?? 0) / (stats.value?.global.total_registrations ?? 1)) * 100,
    bgColor: 'bg-orange-50',
  },
]);
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <template v-if="isLoading">
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
        <span class="mr-1">{{ card.percentage.toFixed(2) }}%</span>
      </div>
    </Card>

    <div v-if="stats" class="col-span-2 lg:col-span-4">
      <CheckinDistributions :tickets="stats.tickets" :tshirts="stats.tshirts" />
    </div>
  </div>
</template>
