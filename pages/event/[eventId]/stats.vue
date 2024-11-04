<script setup lang="ts">
import { ref } from 'vue';
import { format } from 'date-fns';
import { formatThousands, formatCurrency } from '@/utils';
import { useStats } from '~/composables/useStats';
import type { StatsFilters } from '@/types/stats';
import { useEvent } from '~/composables/useEvent';
import { AreaChart } from '@/components/ui/chart-area';
import { DonutChart } from '~/components/ui/chart-donut';

useHead({
  title: 'Stats',
});

definePageMeta({
  title: 'Stats',
  showInMenu: true,
  order: 4,
  icon: 'solar:pie-chart-2-bold-duotone',
  group: 'reports',
  layout: 'dashboard-with-sidebar',
});

const { event } = useEvent();
const eventId = computed(() => event.value?.id);

// Date picker refs
const dateRange = ref<[Date | null, Date | null]>([null, null]);

// Filters
const filters = ref<StatsFilters>({
  date_start: '',
  date_end: '',
  group: '',
});

// Watch date range changes
watch(dateRange, (newRange) => {
  filters.value = {
    ...filters.value,
    date_start: newRange[0] ? formatDate(newRange[0]) : '',
    date_end: newRange[1] ? formatDate(newRange[1]) : '',
  };
});

const {
  attendeeStats,
  transactionStats,
  customFieldStats,
  isAttendeeLoading,
  isTransactionLoading,
  isCustomFieldLoading,
} = useStats(eventId, filters);

// Chart data computeds
const registrationChartData = computed(() => {
  if (!transactionStats.value?.daily_registrations) return [];

  return transactionStats.value.daily_registrations.map((item) => ({
    name: item.date,
    Approved: item.approved,
    Pending: item.pending
  }));
});

const totalAttendees = computed(() => {
  if (!attendeeStats.value) return 0;
  return attendeeStats.value.total_approved + attendeeStats.value.total_pending;
});

const statusChartData = computed(() => {
  if (!attendeeStats.value?.by_status) return [];

  return Object.entries(attendeeStats.value.by_status).map(([status, count]) => ({
    name: formatStatus(status),
    total: count,
  }));
});

const ticketChartData = computed(() => {
  if (!attendeeStats.value?.by_ticket) return [];

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
    RPP: 'Pending',
    RCN: 'Cancelled',
    RDC: 'Declined',
    RNA: 'Not Approved',
  };
  return statusMap[status] || status;
};

// Helper function to format dates using date-fns
const formatDate = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-10 flex justify-between items-center">
      <h1 class="h2 mb-5">Stats</h1>
      <!-- Date Range Filter -->
      <div class="flex items-center gap-4"></div>
    </header>

    <!-- Attendee Stats -->
    <section class="mb-8">
      <div v-if="isAttendeeLoading" class="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Skeleton v-for="i in 3" :key="i" class="bg-muted-foreground/10 h-28 rounded-xl" />
      </div>
      <div v-else-if="attendeeStats" class="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div class="flex flex-col gap-4">
          <Card class="bg-gradient-to-tr from-primary to-primary/40">
            <CardHeader>
              <CardTitle>Total Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid divide-x divide-card/40 grid-cols-2 gap-2">
                <div class="col-span-2">
                  <div class="text-3xl font-bold text-slate-100 tabular-nums">{{ formatThousands(attendeeStats.total_approved) }}</div>
                  <div class="text-sm text-slate-300">Total</div>
                </div>
                
                  <div class="pl-3">
                    <div class="text-xl font-semibold text-slate-100 tabular-nums">{{ formatThousands(attendeeStats.total_pending) }}</div>
                    <div class="text-sm text-slate-300">Pending</div>
                  </div>
                  <div class="pl-3">
                    <div class="text-xl font-semibold text-slate-100 tabular-nums">{{ formatThousands(totalAttendees) }}</div>
                    <div class="text-sm text-slate-300">Registrations</div>
                  </div>
                
              </div>
            </CardContent>
          </Card>

          <Card v-if="transactionStats" class="bg-gradient-to-tr from-emerald-400 to-emerald-200 dark:from-emerald-400 dark:to-emerald-400/20">
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold tabular-nums">
                {{ formatThousands(transactionStats.total_revenue) }} <sup class="font-normal text-sm">IDR</sup>
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
              <DonutChart :data="statusChartData" index="name" category="total" :value-formatter="valueFormatter" />
              <div class="grid justify-center gap-2 mt-4">
                <div v-for="(value, i) in statusChartData.slice(0, 8)" :key="i" class="flex w-full items-start gap-2">
                  <Badge variant="outline" class="flex justify-between w-full">
                    <span>{{ value.name }}</span>
                    <span class="rounded-full bg-muted text-primary px-2 py-1 ml-2">{{ value.total }} </span>
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
              <DonutChart :data="ticketChartData" index="name" category="total" :value-formatter="valueFormatter" />
              <div class="grid justify-center gap-2 mt-4">
                <div v-for="(value, i) in ticketChartData.slice(0, 8)" :key="i" class="flex w-full items-start gap-2">
                  <Badge variant="outline" class="flex justify-between w-full">
                    <span>{{ value.name }}</span>
                    <span class="rounded-full bg-muted text-primary px-2 py-1 ml-2">{{ value.total }} </span>
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
      <div v-if="isTransactionLoading" class="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Skeleton v-for="i in 2" :key="i" class="bg-muted-foreground/10 h-28 rounded-xl" />
      </div>
      <div v-else-if="transactionStats" class="grid gap-4 grid-cols-1 md:grid-cols-2">
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
    <section class="mb-8" v-if="customFieldStats">
      <h2 class="text-xl font-semibold mb-4">Custom Field</h2>
      <div v-if="isCustomFieldLoading" class="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Skeleton v-for="i in 2" :key="i" class="bg-muted-foreground/10 h-28 rounded-xl" />
      </div>
      <div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card v-for="(field, key) in customFieldStats" :key="key">
          <CardHeader>
            <CardTitle>{{ field.label }}</CardTitle>
          </CardHeader>
          <CardContent class="">
            <DonutChart
              :data="
                field.values.map((v) => ({
                  name: v.value,
                  total: v.count,
                }))
              "
              index="name"
              category="total"
              :value-formatter="valueFormatter"
            />
            <!-- Legends, max 8 -->
            <div class="flex flex-wrap justify-center gap-2 mt-4 text-xs">
              <div v-for="(value, i) in field.values.slice(0, 8)" :key="i" class="flex items-start gap-2">
                <Badge variant="outline">
                  <span>{{ value.value }}</span>
                  <span class="rounded-full number tabular-nums bg-muted text-primary px-2 py-1 ml-2">{{ value.count }} </span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Error States -->
    <!-- <Alert v-if="attendeeError || transactionError || customFieldError" variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription> There was an error loading the statistics. Please try again later. </AlertDescription>
    </Alert> -->
  </div>
</template>
