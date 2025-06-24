<!-- components/partials/dashboard/TicketsCapacity.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatThousands } from '@/utils';

const route = useRoute();
const eventId = computed(() => route.params.eventId as string || '');

const onlyOnSale = ref(true);

const getTicketsCapacity = async (evtId: Ref<string>, onlyOnSale: Ref<boolean>) => {
  const { $galantisApi } = useNuxtApp();

  const params: Record<string, any> = {
    include_sales: true,
  };

  if (onlyOnSale.value) {
    params.only_on_sale = true;
  }
  const response = await $galantisApi.get(`/event/${evtId.value}/tickets`, {
    params,
  });

  // Sort tickets by order
  response.data.sort((a: any, b: any) => a.order - b.order);
  return response.data;
};

const { data: tickets, isLoading, isError } = useQuery({
  enabled: !!eventId.value,
  queryFn: () => getTicketsCapacity(eventId, onlyOnSale),
  queryKey: ['ticketsCapacity', eventId, onlyOnSale],
});

const ticketsWithCapacity = computed(() => {
  if (!tickets.value)
    return [];

  return tickets.value.map((ticket: any) => {
    const sold = ticket.sold || 0;
    const quantity = ticket.quantity || 0;
    const percentage = quantity > 0 ? Math.round((sold / quantity) * 100) : 0;
    const isSoldOut = quantity > 0 && sold >= quantity;

    // Filter out tickets that are not on sale if onlyOnSale is true
    if (onlyOnSale.value && !ticket.is_on_sale) {
      return null;
    }

    return {
      id: ticket.id,
      name: ticket.name,
      sold,
      quantity,
      percentage,
      available: ticket.available && !isSoldOut,
      is_on_sale: ticket.is_on_sale,
      is_sold_out: isSoldOut,
      status_code: ticket.status_code,
      // Include sales stats for additional info
      total_registrations: ticket.sales_stats?.total_sold || ticket.constraints?.total_registrations || 0,
      revenue: ticket.sales_stats?.revenue || 0,
    };
  });
});

// Get status label and color
const getTicketStatus = (ticket: any) => {
  if (ticket.is_sold_out) {
    return {
      label: 'Sold Out',
      class: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    };
  }
  if (!ticket.is_on_sale) {
    return {
      label: 'Not on Sale',
      class: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
    };
  }
  if (ticket.percentage > 80) {
    return {
      label: 'Limited',
      class: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    };
  }
  return {
    label: 'Available',
    class: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  };
};

// Get border color for ticket cards
const getTicketBorderColor = (ticket: any) => {
  if (ticket.is_sold_out)
    return 'border-l-red-500';
  if (!ticket.is_on_sale)
    return 'border-l-gray-500';
  if (ticket.percentage > 80)
    return 'border-l-orange-500';
  if (ticket.percentage > 50)
    return 'border-l-yellow-500';
  return 'border-l-green-500';
};

// Get progress bar color based on percentage
const getProgressColor = (percentage: number) => {
  if (percentage >= 90)
    return 'bg-red-200 dark:bg-red-900';
  if (percentage >= 70)
    return 'bg-orange-200 dark:bg-orange-900';
  if (percentage >= 50)
    return 'bg-yellow-200 dark:bg-yellow-900';
  return 'bg-green-200 dark:bg-green-900';
};

const getProgressTextColor = (percentage: number) => {
  if (percentage >= 90)
    return 'text-red-500 dark:text-red-400';
  if (percentage >= 70)
    return 'text-orange-500 dark:text-orange-400';
  if (percentage >= 50)
    return 'text-yellow-500 dark:text-yellow-400';
  return 'text-green-500 dark:text-green-400';
};

const getProgressFillColor = (percentage: number) => {
  if (percentage >= 90)
    return 'bg-red-500 dark:bg-red-400';
  if (percentage >= 70)
    return 'bg-orange-500 dark:bg-orange-400';
  if (percentage >= 50)
    return 'bg-yellow-500 dark:bg-yellow-400';
  return 'bg-green-500 dark:bg-green-400';
};
</script>

<template>
  <Card class="relative overflow-hidden">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>
        Tickets Capacity
      </CardTitle>
      <div class="flex items-center space-x-2">
        <label for="upcoming-filter" class="cursor-pointer text-xs text-muted-foreground">
          On Sale Only
        </label>
        <Switch id="upcoming-filter" v-model:checked="onlyOnSale" class="scale-75" />
      </div>
    </CardHeader>
    <CardContent class="scroll-area max-h-[570px] overflow-y-auto">
      <div v-if="isLoading" class="space-y-3">
        <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
      </div>

      <div v-else-if="isError" class="text-center text-sm text-muted-foreground">
        Error loading tickets
      </div>

      <div v-else-if="ticketsWithCapacity.length === 0" class="text-center text-sm text-muted-foreground">
        No tickets available
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="ticket in ticketsWithCapacity"
          :key="ticket.id"
          class="rounded-lg border border-l-4 p-3 transition-colors hover:bg-accent/50"
          :class="getTicketBorderColor(ticket)"
        >
          <div class="flex items-center justify-between gap-2">
            <h4 class="truncate text-sm font-medium">
              {{ ticket.name }}
            </h4>
            <span class="shrink-0 rounded-full px-2 py-1 text-xs font-medium" :class="getTicketStatus(ticket).class">
              {{ getTicketStatus(ticket).label }}
            </span>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">
                {{ formatThousands(ticket.sold) }} sold
                <span v-if="ticket.quantity > 0">
                  of {{ formatThousands(ticket.quantity) }}
                </span>
                <span v-else class="text-xs">
                  (unlimited)
                </span>
              </span>
              <span
                class="font-medium"
                :class="[
                  getProgressTextColor(ticket.percentage),
                ]"
              >
                {{ ticket.quantity > 0 ? `${ticket.percentage}%` : '-' }}
              </span>
            </div>

            <!-- Progress bar -->

            <div
              v-if="ticket.quantity > 0"
              class="relative h-1.5 w-full overflow-hidden rounded-full"
              :class="getProgressColor(ticket.percentage)"
            >
              <div
                class="h-full rounded-full transition-all duration-300 ease-out"
                :class="getProgressFillColor(ticket.percentage)"
                :style="{ width: `${Math.min(ticket.percentage, 100)}%` }"
              />
            </div>

            <!-- Warning messages for limited tickets -->
            <div
              v-if="ticket.percentage >= 90 && !ticket.is_sold_out && ticket.quantity > 0"
              class="mt-1 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400"
            >
              <Icon icon="heroicons:exclamation-triangle" class="size-3" />
              Only {{ ticket.quantity - ticket.sold }} tickets left
            </div>

            <div
              v-else-if="ticket.is_sold_out"
              class="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
            >
              <Icon icon="heroicons:x-circle" class="size-3" />
              This ticket is sold out
            </div>

            <!-- Additional info for high capacity tickets -->
            <div
              v-else-if="ticket.total_registrations > ticket.sold && ticket.total_registrations > 0"
              class="mt-1 text-xs text-muted-foreground"
            >
              <span class="flex items-center gap-1">
                <Icon icon="heroicons:information-circle" class="size-3" />
                Total registrations: {{ formatThousands(ticket.total_registrations) }}
                <span v-if="ticket.total_registrations > ticket.sold">
                  ({{ ticket.total_registrations - ticket.sold }} pending/incomplete)
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
