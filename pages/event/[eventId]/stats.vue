<script setup lang="ts">
import { format } from 'date-fns';
import { ref } from 'vue';

import type { CustomFieldChartItem, StatsFilters } from '@/types/stats';

import { AreaChart } from '@/components/ui/chart-area';
import { formatThousands } from '@/utils';
import { DonutChart } from '~/components/ui/chart-donut';
import { useEvent } from '~/composables/useEvent';
import { useStats } from '~/composables/useStats';

useHead({
  title: 'Stats',
});

definePageMeta({
  group: 'reports',
  icon: 'solar:pie-chart-2-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 4,
  showInMenu: true,
  title: 'Stats',
});

const { event } = useEvent();
const eventId = computed(() => event.value?.id);

// Date picker refs
const dateRange = ref<[Date | null, Date | null]>([null, null]);

// Filters
const filters = ref<StatsFilters>({
  date_end: '',
  date_start: '',
  group: '',
});

// Watch date range changes
watch(dateRange, (newRange) => {
  filters.value = {
    ...filters.value,
    date_end: newRange[1] ? formatDate(newRange[1]) : '',
    date_start: newRange[0] ? formatDate(newRange[0]) : '',
  };
});

const {
  attendeeStats,
  customFieldStats,
  isAttendeeLoading,
  isCustomFieldLoading,
  isTransactionLoading,
  transactionStats,
} = useStats(eventId, filters);

// Chart data computeds
const registrationChartData = computed(() => {
  if (!transactionStats.value?.daily_registrations)
    return [];

  return transactionStats.value.daily_registrations.map(item => ({
    Approved: item.approved,
    name: item.date,
    Pending: item.pending,
  }));
});

const totalAttendees = computed(() => {
  if (!attendeeStats.value)
    return 0;
  return attendeeStats.value.total_approved + attendeeStats.value.total_pending;
});

const statusChartData = computed(() => {
  if (!attendeeStats.value?.by_status)
    return [];

  return Object.entries(attendeeStats.value.by_status).map(([status, count]) => ({
    name: formatStatus(status),
    total: count,
  }));
});

const ticketChartData = computed(() => {
  if (!attendeeStats.value?.by_ticket)
    return [];

  return Object.entries(attendeeStats.value.by_ticket).map(([ticket, count]) => ({
    name: ticket,
    total: count,
  }));
});

const valueFormatter = (tick: number | Date) => (typeof tick === 'number' ? formatThousands(tick) : '');

// Helper functions with proper typing
const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    RAP: 'Approved',
    RCN: 'Cancelled',
    RDC: 'Declined',
    RNA: 'Not Approved',
    RPP: 'Pending',
  };
  return statusMap[status] || status;
};

// Helper function to format dates using date-fns
const formatDate = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  }
  catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="flex items-center justify-between pt-10">
      <h1 class="h2 mb-5">
        Stats
      </h1>
      <!-- Date Range Filter -->
      <div class="flex items-center gap-4" />
    </header>

    <!-- Attendee Stats -->
    <section class="mb-8">
      <div v-if="isAttendeeLoading" class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton v-for="i in 3" :key="i" class="h-28 rounded-xl bg-muted-foreground/10" />
      </div>
      <div v-else-if="attendeeStats" class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="flex flex-col gap-4">
          <Card class="bg-gradient-to-tr from-primary to-primary/40">
            <CardHeader>
              <CardTitle>Total Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 gap-2 divide-x divide-card/40">
                <div class="col-span-2">
                  <div class="text-3xl font-bold tabular-nums text-slate-100">
                    {{ formatThousands(attendeeStats.total_approved) }}
                  </div>
                  <div class="text-sm text-slate-300">
                    Total
                  </div>
                </div>

                <div class="pl-3">
                  <div class="text-xl font-semibold tabular-nums text-slate-100">
                    {{ formatThousands(attendeeStats.total_pending) }}
                  </div>
                  <div class="text-sm text-slate-300">
                    Pending
                  </div>
                </div>
                <div class="pl-3">
                  <div class="text-xl font-semibold tabular-nums text-slate-100">
                    {{ formatThousands(totalAttendees) }}
                  </div>
                  <div class="text-sm text-slate-300">
                    Registrations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            v-if="transactionStats"
            class="bg-gradient-to-tr from-emerald-400 to-emerald-200 dark:from-emerald-400 dark:to-emerald-400/20"
          >
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold tabular-nums">
                {{ formatThousands(transactionStats.total_revenue.gross_sales) }}
                <sup class="text-sm font-normal">IDR</sup>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent class="">
              <DonutChart
                :data="statusChartData"
                index="name"
                category="total"
                :value-formatter="valueFormatter"
              />
              <div class="mt-4 grid justify-center gap-2">
                <div v-for="(value, i) in statusChartData.slice(0, 8)" :key="i" class="flex w-full items-start gap-2">
                  <Badge variant="outline" class="flex w-full justify-between">
                    <span>{{ value.name }}</span>
                    <span class="ml-2 rounded-full bg-muted px-2 py-1 text-primary">{{ value.total }} </span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ticket Distribution</CardTitle>
            </CardHeader>
            <CardContent class="">
              <DonutChart
                :data="ticketChartData"
                index="name"
                category="total"
                :value-formatter="valueFormatter"
              />
              <div class="mt-4 grid justify-center gap-2">
                <div v-for="(value, i) in ticketChartData.slice(0, 8)" :key="i" class="flex w-full items-start gap-2">
                  <Badge variant="outline" class="flex w-full justify-between">
                    <span>{{ value.name }}</span>
                    <span class="ml-2 rounded-full bg-muted px-2 py-1 text-primary">{{ value.total }} </span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <!-- Transaction Stats -->
    <section class="mb-8">
      <div v-if="isTransactionLoading" class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton v-for="i in 2" :key="i" class="h-28 rounded-xl bg-muted-foreground/10" />
      </div>
      <div v-else-if="transactionStats" class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card class="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Daily Registrations</CardTitle>
          </CardHeader>
          <CardContent class="">
            <AreaChart
              :data="registrationChartData"
              index="name"
              :categories="['Approved', 'Pending']"
              :colors="['blue', 'orange']"
            />
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Custom Field Stats -->
    <section v-if="customFieldStats" class="mb-8">
      <h2 class="mb-4 text-xl font-semibold">
        Custom Field
      </h2>
      <div v-if="isCustomFieldLoading" class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton v-for="i in 2" :key="i" class="h-28 rounded-xl bg-muted-foreground/10" />
      </div>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card v-for="(field, key) in customFieldStats" :key="key">
          <CardHeader>
            <CardTitle>{{ field.label }}</CardTitle>
          </CardHeader>
          <CardContent class="">
            <DonutChart
              :data="
                field.values.map((v: CustomFieldChartItem) => ({
                  name: v.value,
                  total: v.count,
                }))
              "
              index="name"
              category="total"
              :value-formatter="valueFormatter"
            />
            <!-- Legends, max 8 -->
            <div class="mt-4 flex flex-wrap justify-center gap-2 text-xs">
              <div v-for="(value, i) in field.values.slice(0, 8)" :key="i" class="flex items-start gap-2">
                <Badge variant="outline">
                  <span>{{ value.value }}</span>
                  <span class="number ml-2 rounded-full bg-muted px-2 py-1 tabular-nums text-primary">{{ value.count }}
                  </span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
