<!-- components/partials/dashboard/CompactStatsChart.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

import type { TransactionStats } from '@/types/stats';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart } from '@/components/ui/chart-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatThousands } from '@/utils';

const route = useRoute();
const eventId = computed(() => route.params.eventId as string || '');

const timeFrameOptions = [
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
];

const selectedTimeFrame = ref('this_week');

const getTransactionStats = async (evtId: string, timeFrame: string): Promise<TransactionStats> => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId}/stats/transaction`, {
    params: { time_frame: timeFrame },
  });
  return response.data;
};

const { data: stats, isLoading, isError } = useQuery({
  enabled: !!eventId.value,
  queryFn: () => getTransactionStats(eventId.value, selectedTimeFrame.value),
  queryKey: ['compactTransactionStats', eventId, selectedTimeFrame],
  staleTime: 5 * 60 * 1000,
});

// Updated chart data to include both Approved and Pending
const chartData = computed(() => {
  if (!stats.value?.daily_registrations)
    return [];

  return stats.value.daily_registrations.map(item => ({
    name: formatDate(item.date, 'MMM dd'),
    date: item.date,
    Approved: item.approved,
    Pending: item.pending,
    Total: item.approved + item.pending,
  }));
});

// Summary metrics
const totalApproved = computed(() => stats.value?.summary?.total_approved || 0);
const totalPending = computed(() => stats.value?.summary?.total_pending || 0);
const totalRegistrations = computed(() => stats.value?.summary?.total_registrations || 0);
</script>

<template>
  <Card class="relative overflow-hidden">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>
        <NuxtLink :to="`/event/${eventId}/stats`" class="hover:underline">
          Registration Trend
        </NuxtLink>
      </CardTitle>
      <Select v-model="selectedTimeFrame">
        <SelectTrigger class="h-8 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in timeFrameOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </CardHeader>

    <CardContent>
      <div v-if="isLoading" class="space-y-3">
        <Skeleton class="h-6 w-16" />
        <Skeleton class="h-32 w-full" />
        <div class="grid grid-cols-2 gap-2">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
        </div>
      </div>

      <div v-else-if="isError" class="py-4 text-center">
        <Icon icon="solar:danger-triangle-bold-duotone" class="mb-1 size-8 text-red-500" />
        <span class="text-xs text-muted-foreground">Error loading chart</span>
      </div>

      <div v-else-if="stats" class="space-y-4">
        <!-- Main metric -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <div class="text-2xl font-bold tabular-nums text-indigo-600">
              {{ formatThousands(totalRegistrations) }}
            </div>
            <p class="text-xs text-muted-foreground">
              Total registrations
            </p>
          </div>
          <div class="rounded-lg bg-green-50 p-2 text-center dark:bg-emerald-500/10">
            <div class="text-lg font-semibold tabular-nums text-green-600">
              {{ formatThousands(totalApproved) }}
            </div>
            <div class="text-xs text-muted-foreground">
              Approved
            </div>
          </div>
          <div class="rounded-lg bg-sky-50 p-2 text-center dark:bg-sky-500/10">
            <div class="text-lg font-semibold tabular-nums text-sky-600">
              {{ formatThousands(totalPending) }}
            </div>
            <div class="text-xs text-muted-foreground">
              Pending
            </div>
          </div>
        </div>

        <!-- Chart with both lines -->
        <div>
          <AreaChart
            :data="chartData"
            index="name"
            :categories="['Approved', 'Pending']"
            :colors="['#22c55e', '#0ea5e9']"
            :height="180"
            :show-legend="true"
            :show-grid-line="false"
            :show-tooltip="true"
            :style="{ height: '150px' }"
          />
        </div>

        <!-- Quick stats -->
        <div class="grid grid-cols-2 gap-2 border-t pt-2 text-xs text-muted-foreground">
          <div class="text-center">
            <span class="font-medium">{{ Math.round(stats.summary.avg_daily_total) }}</span>
            <div>Daily avg</div>
          </div>
          <div class="text-center">
            <span class="font-medium">{{ stats.summary.conversion_rate }}%</span>
            <div>Conversion</div>
          </div>
        </div>
      </div>

      <div v-else class="py-8 text-center">
        <Icon icon="solar:chart-2-bold-duotone" class="mb-1 size-8 text-muted-foreground" />
        <span class="text-xs text-muted-foreground">No data available</span>
      </div>
    </CardContent>
  </Card>
</template>
