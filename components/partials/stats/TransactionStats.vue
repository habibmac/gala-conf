<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

import type { TransactionStats } from '~/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvent } from '~/composables/useEvent';
import { formatDate } from '~/utils';

const { event } = useEvent();
const eventId = computed(() => event.value?.id);

const timeFrameOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'all_time', label: 'All Time' },
];

const selectedTimeFrame = ref('last_7_days');

const handleTimeFrameChange = (value: string) => {
  selectedTimeFrame.value = value;
};

const getTransactionStats = async (evtId: string, timeFrame: string): Promise<TransactionStats> => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId}/stats/transaction`, {
    params: { time_frame: timeFrame },
  });
  return response.data;
};

const {
  data: transactionStats,
  isLoading: isTransactionLoading,
  isError,
  error,
} = useQuery({
  queryKey: ['transaction-stats', eventId, selectedTimeFrame],
  queryFn: () => getTransactionStats(eventId.value!, selectedTimeFrame.value),
  enabled: computed(() => !!eventId.value),
});

const chartData = computed(() => {
  if (!transactionStats.value?.daily_registrations) {
    return [];
  }

  return transactionStats.value.daily_registrations.map(item => ({
    name: formatDate(item.date, 'dd MMM'),
    date: item.date,
    Approved: item.approved,
    Pending: item.pending,
    Total: item.approved + item.pending,
  }));
});
</script>

<template>
  <header class="mb-4 flex items-center justify-between">
    <h2 class="text-lg font-semibold">
      Transaction Stats
    </h2>
    <div>
      <Select :model-value="selectedTimeFrame" @update:model-value="handleTimeFrameChange">
        <SelectTrigger class="w-48 bg-card">
          <SelectValue placeholder="Select time frame" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in timeFrameOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </header>
  <!-- Error State -->
  <div v-if="isError" class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
    <p class="text-sm text-destructive">
      Failed to load transaction stats: {{ error?.message || 'Unknown error' }}
    </p>
  </div>

  <!-- Loading State -->
  <div v-else-if="isTransactionLoading" class="space-y-6">
    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="h-20 w-full rounded-lg bg-muted-foreground/10" />
      <Skeleton v-for="i in 1" :key="i" class="col-span-2 h-80 rounded-xl bg-muted-foreground/10 md:col-span-4" />
    </div>
  </div>

  <!-- Data State -->
  <div v-else-if="transactionStats" class="space-y-6">
    <!-- Stats Display -->
    <div class="space-y-4">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold">
              {{ transactionStats.summary.total_registrations }}
            </div>
            <div class="text-sm text-muted-foreground">
              Total Registrations
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold">
              {{ transactionStats.summary.avg_daily_total }}
            </div>
            <div class="text-sm text-muted-foreground">
              Daily Average
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold">
              {{ transactionStats.summary.conversion_rate }}%
            </div>
            <div class="text-sm text-muted-foreground">
              Conversion Rate
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-2xl font-bold">
              {{ transactionStats.summary.peak_count }}
            </div>
            <div class="text-sm text-muted-foreground">
              Peak Day
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Chart -->
      <Card>
        <CardHeader>
          <CardTitle>Daily Registrations - {{ transactionStats.time_frame.label }}</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart
            :data="chartData"
            index="name"
            :categories="['Approved', 'Pending']"
            :colors="['#22c55e', '#f97316']"
          />
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- No Event State -->
  <div v-else class="rounded-lg border border-muted bg-muted/10 p-4">
    <p class="text-sm text-muted-foreground">
      No event selected. Please select an event to view transaction stats.
    </p>
  </div>
</template>
