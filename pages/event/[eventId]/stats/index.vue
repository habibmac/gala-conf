<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { format } from 'date-fns';
import { ref } from 'vue';

import type { CustomFieldChartItem, StatsFilters } from '@/types/stats';

import TransactionStats from '@/components/partials/stats/TransactionStats.vue';
import { formatCurrency, formatThousands } from '@/utils';
import StatCard from '~/components/partials/stats/StatCard.vue';
import { DonutChart } from '~/components/ui/chart-donut';
import { useStats } from '~/composables/useStats';

useHead({
  title: 'Stats',
});

definePageMeta({
  capabilities: ['ee_read_registrations'],
  group: 'reports',
  icon: 'solar:pie-chart-2-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 4,
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Stats',
});

const route = useRoute();
const eventId = computed(() => route.params.eventId as string || '');

const { event } = useEvent();

// Date picker refs
const dateRange = ref<[Date | null, Date | null]>([null, null]);

// Filters
const filters = ref<StatsFilters>({
  date_end: '',
  date_start: '',
  group: '',
  time_frame: 'last_7_days',
});

const maxLegendItems = ref(10);

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
  transactionStats,
} = useStats(eventId, filters);

// Computed values
const totalAttendees = computed(() => {
  if (!attendeeStats.value)
    return 0;
  return attendeeStats.value.total_approved + attendeeStats.value.total_pending;
});

const statusChartData = computed(() => {
  if (!attendeeStats.value?.by_status)
    return [];

  return Object.entries(attendeeStats.value.by_status)
    .map(([status, count]) => ({
      name: getStatusLabel(status),
      total: count,
      color: getStatusColor(status),
    }))
    .sort((a, b) => b.total - a.total);
});

const ticketChartData = computed(() => {
  if (!attendeeStats.value?.by_ticket)
    return [];

  return Object.entries(attendeeStats.value.by_ticket)
    .map(([ticket, count]) => ({
      name: ticket,
      total: count,
    }))
    .sort((a, b) => b.total - a.total);
});

// Status configuration
const statusConfig: Record<string, { label: string, color: string, icon: string }> = {
  RAP: { label: 'Approved', color: 'green', icon: 'heroicons:check-circle' },
  RCN: { label: 'Cancelled', color: 'red', icon: 'heroicons:x-circle' },
  RDC: { label: 'Declined', color: 'orange', icon: 'heroicons:exclamation-circle' },
  RNA: { label: 'Not Approved', color: 'yellow', icon: 'heroicons:clock' },
  RPP: { label: 'Pending', color: 'blue', icon: 'heroicons:clock' },
};

// Helper functions
const getStatusLabel = (status: string): string => {
  return statusConfig[status]?.label || status;
};

const getStatusColor = (status: string): string => {
  return statusConfig[status]?.color || 'gray';
};

const formatDate = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  }
  catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

const valueFormatter = (tick: number | Date) =>
  typeof tick === 'number' ? formatThousands(tick) : '';

const handleClickMore = () => {
  maxLegendItems.value = 100;
};

// Stat card configuration
const getStatCards = computed(() => {
  if (!attendeeStats.value)
    return [];

  return [
    {
      title: 'Total Approved',
      value: attendeeStats.value.total_approved,
      icon: 'heroicons:user-group',
      bgColor: 'bg-green-500',
      gradient: 'from-green-500 to-green-200 dark:from-green-400/60 dark:to-green-400/10',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'Pending',
      value: attendeeStats.value.total_pending,
      icon: 'heroicons:clock',
      bgColor: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-200 dark:from-blue-400/80 dark:to-blue-400/10',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Total Registrations',
      value: totalAttendees.value,
      icon: 'heroicons:users',
      bgColor: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-200 dark:from-purple-400/80 dark:to-purple-400/10',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
  ];
});

const downloadStatsData = (stats: any, title: string) => {
  const csvContent = [
    ['Status', 'Count'],
    ...Object.entries(stats.by_status).map(([status, count]) => [getStatusLabel(status), count]),
  ]
    .map(e => e.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeEventName = event.value?.title ? event.value.title.replace(/[^a-z0-9]/gi, '_') : 'event';

  link.setAttribute('href', url);
  link.setAttribute('download', `${title} Stats - ${safeEventName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadTicketDistribution = (data: any) => {
  const csvContent = [
    ['Ticket', 'Count'],
    ...data.map((item: any) => [item.name, item.total]),
  ]
    .map(e => e.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeEventName = event.value?.title ? event.value.title.replace(/[^a-z0-9]/gi, '_') : 'event';

  link.setAttribute('href', url);
  link.setAttribute('download', `Ticket Distribution Stats - ${safeEventName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadCustomFieldData = (field: any) => {
  const csvContent = [
    ['Value', 'Count'],
    ...field.values.map((v: CustomFieldChartItem) => [v.value || 'Not specified', v.count]),
  ]
    .map(e => e.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeEventName = event.value?.title ? event.value.title.replace(/[^a-z0-9]/gi, '_') : 'event';

  link.setAttribute('href', url);
  link.setAttribute('download', `${field.label} Stats - ${safeEventName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="container mx-auto mb-20">
    <header class="mb-6 flex flex-col gap-4 pt-10 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="h2 mb-2">
          Event Statistics
        </h1>
        <p class="text-muted-foreground">
          Comprehensive overview of your event's performance
        </p>
      </div>

      <!-- Date Range Filter -->
      <div class="flex items-center gap-4">
        <!-- Add date range picker here if needed -->
      </div>
    </header>

    <!-- Key Metrics Section -->
    <section class="mb-8">
      <h2 class="mb-4 text-lg font-semibold">
        Key Metrics
      </h2>

      <div v-if="isAttendeeLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton v-for="i in 4" :key="i" class="h-32 rounded-lg bg-muted-foreground/10" />
      </div>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Registration Stats -->
        <StatCard
          v-for="card in getStatCards"
          :key="card.title"
          :title="card.title"
          :value="card.value"
          :icon="card.icon"
          :gradient="card.gradient"
          :border-color="card.borderColor"
        />

        <!-- Revenue Card -->
        <div
          v-if="transactionStats"
          class="relative overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-tr from-emerald-500 to-emerald-200 p-6 text-white transition-shadow duration-200 hover:shadow-lg dark:border-emerald-800 dark:from-emerald-400/60 dark:to-emerald-400/10"
        >
          <Icon icon="heroicons:currency-dollar" class="absolute right-4 top-4 size-8 text-white/20" />
          <div class="space-y-2">
            <p class="text-sm font-medium text-white/90">
              Total Revenue
            </p>
            <p class="text-2xl font-semibold text-white 2xl:text-3xl">
              {{ formatCurrency(transactionStats.total_revenue.gross_sales) }}
            </p>
            <p class="text-xs text-white/70">
              Gross sales
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Charts Section -->
    <section class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Status Distribution -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Registration Status</CardTitle>
            <DropdownMenu v-if="attendeeStats && Object.keys(attendeeStats).length > 0">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon">
                  <Icon icon="tabler:dots-vertical" class="size-4" />
                  <span class="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click.prevent="downloadStatsData(attendeeStats, 'Registration Status')">
                  Download CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="isAttendeeLoading" class="flex h-64 items-center justify-center">
            <Skeleton class="size-48 rounded-full" />
          </div>

          <div v-else-if="statusChartData.length > 0" class="space-y-4">
            <DonutChart
              :data="statusChartData"
              index="name"
              category="total"
              :value-formatter="valueFormatter"
              class="h-64"
            />

            <!-- Legend -->
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="item in statusChartData"
                :key="item.name"
                class="flex items-center justify-between rounded-lg border p-2 text-sm"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="size-3 rounded-full"
                    :class="{
                      'bg-green-500': item.color === 'green',
                      'bg-red-500': item.color === 'red',
                      'bg-orange-500': item.color === 'orange',
                      'bg-yellow-500': item.color === 'yellow',
                      'bg-blue-500': item.color === 'blue',
                      'bg-gray-500': item.color === 'gray',
                    }"
                  />
                  <span class="text-muted-foreground">{{ item.name }}</span>
                </div>
                <span class="font-medium">{{ formatThousands(item.total) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>

      <!-- Ticket Distribution -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Ticket Distribution</CardTitle>
            <DropdownMenu v-if="ticketChartData && Object.keys(ticketChartData).length > 0">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon">
                  <Icon icon="tabler:dots-vertical" class="size-4" />
                  <span class="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click.prevent="downloadTicketDistribution(ticketChartData)">
                  Download CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="isAttendeeLoading" class="flex h-64 items-center justify-center">
            <Skeleton class="size-48 rounded-full" />
          </div>

          <div v-else-if="ticketChartData.length > 0" class="space-y-4">
            <DonutChart
              :data="ticketChartData"
              index="name"
              category="total"
              :value-formatter="valueFormatter"
              class="h-64"
            />

            <!-- Legend with scroll for many tickets -->
            <div class="scroll-area max-h-40 space-y-2 overflow-y-auto">
              <div
                v-for="(item) in ticketChartData"
                :key="item.name"
                class="flex items-center justify-between rounded-lg border p-2 text-sm"
              >
                <span class="truncate text-muted-foreground">{{ item.name }}</span>
                <span class="shrink-0 font-medium">{{ formatThousands(item.total) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- Transaction Stats -->
    <section class="mb-8">
      <TransactionStats />
    </section>

    <!-- Custom Field Stats -->
    <section v-if="customFieldStats && Object.keys(customFieldStats).length > 0" class="mb-8">
      <h2 class="mb-4 text-lg font-semibold">
        Custom Field Analytics
      </h2>

      <div v-if="isCustomFieldLoading" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton v-for="i in 3" :key="i" class="h-80 rounded-lg" />
      </div>

      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="(field, key) in customFieldStats" :key="key">
          <CardHeader>
            <CardTitle class="flex items-center justify-between gap-2 text-base">
              <span>{{ field.label }}</span>
              <!-- Download data in csv format -->
              <!-- <Button
                v-if="field.values.length > 0"
                variant="ghost"
                size="icon"
                @click.prevent="downloadCustomFieldData(field)"
              >
                <Icon icon="solar:download-bold-duotone" class="size-4 text-muted-foreground" />
              </Button> -->
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon">
                    <Icon icon="tabler:dots-vertical" class="size-4" />
                    <span class="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click.prevent="downloadCustomFieldData(field)">
                    Download CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              :data="field.values.map((v: CustomFieldChartItem) => ({
                name: v.value || 'Not specified',
                total: v.count,
              }))"
              index="name"
              category="total"
              :value-formatter="valueFormatter"
              class="h-48"
            />

            <!-- Compact legend -->
            <div class="mt-4 max-h-32 space-y-1 overflow-y-auto">
              <div
                v-for="(valueLegend, i) in field.values.slice(0, maxLegendItems)"
                :key="i"
                class="flex items-center justify-between text-xs"
              >
                <span class="truncate text-muted-foreground">{{ valueLegend.value || 'Not specified' }}</span>
                <Badge variant="secondary" class="ml-2 text-xs">
                  {{ formatThousands(valueLegend.count) }}
                </Badge>
              </div>
              <Button
                v-if="field.values.length > maxLegendItems"
                class="mt-2 w-full"
                variant="outline"
                size="sm"
                @click="handleClickMore"
              >
                <div v-if="field.values.length > maxLegendItems" class="text-center text-xs text-muted-foreground">
                  +{{ field.values.length - maxLegendItems }} more
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
