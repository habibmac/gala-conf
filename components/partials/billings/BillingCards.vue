<script setup lang="ts">
import { formatThousands } from '@/utils';
import { useQuery } from '@tanstack/vue-query';
import { Icon } from '@iconify/vue';
import { Skeleton } from '@/components/ui/skeleton';

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');

interface BillingSummary {
  gross_sales: number;
  nett_sales: number;
  total_withdrawn: number;
  withdrawable: number;
  fee_percentage: string;
}

// Define the cards data structure
const getCardData = (summaryData: BillingSummary) => [
  {
    title: 'Gross Sales',
    value: summaryData.gross_sales,
    is_currency: true,
    icon: 'solar:graph-up-bold-duotone',
    color: 'text-green-500',
  },
  {
    title: 'Nett Sales',
    value: summaryData.nett_sales,
    is_currency: true,
    icon: 'solar:wallet-money-bold-duotone',
    color: 'text-blue-500',
    subtitle: `After ${summaryData.fee_percentage}% fee`,
  },
  {
    title: 'Total Withdrawn',
    value: summaryData.total_withdrawn,
    is_currency: true,
    icon: 'solar:card-transfer-bold-duotone',
    color: 'text-orange-500',
  },
  {
    title: 'Balance',
    value: summaryData.withdrawable,
    is_currency: true,
    icon: 'solar:dollar-minimalistic-bold-duotone',
    color: 'text-purple-500',
  },
];

// Fetch billing summary data
const getBillingSummary = async (evtId: Ref) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId.value}/billings-summary`);
  return response.data;
};

const { data, isLoading, isError, isRefetching } = useQuery({
  queryKey: ['billingSummary', eventId],
  queryFn: () => getBillingSummary(eventId),
  enabled: !!eventId,
});

// Computed property for card data
const cards = computed(() => {
  if (!data.value?.success) return [];
  return getCardData(data.value.data);
});
</script>

<template>
  <div v-if="isLoading || isRefetching" class="grid gap-4 grid-cols-12">
    <Skeleton
      v-for="i in 4"
      :key="i"
      class="h-28 rounded-xl col-span-12 sm:col-span-6 md:col-span-3 bg-muted-foreground/10"
    />
  </div>
  <div v-else-if="isError" class="py-16">
    <div class="flex h-32 items-center justify-center">Error fetching billing summary. Please try again later.</div>
  </div>
  <template v-else-if="data?.success">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card v-for="item in cards" :key="item.title" class="relative overflow-hidden">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium tracking-normal">
            {{ item.title }}
          </CardTitle>
          <Icon :icon="item.icon" class="size-7" :class="item.color" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-semibold tabular-nums">
            {{ formatThousands(item.value) }}
            <span v-if="item.is_currency" class="text-xs font-medium text-muted-foreground"> IDR </span>
          </div>
          <p v-if="item.subtitle" class="text-xs text-muted-foreground mt-1">
            {{ item.subtitle }}
          </p>
        </CardContent>
      </Card>
    </div>
  </template>
  <template v-else>
    <div class="mx-auto w-full">
      <EmptyState
        title="No billing summary available"
        description="There is no billing summary available for this event."
        :img="{ src: '/images/empty-state/no-data.svg', alt: 'No data' }"
      />
    </div>
  </template>
</template>
