<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';

import { Skeleton } from '@/components/ui/skeleton';
import { formatThousands } from '@/utils';
import BillingBankAccount from '~/components/partials/billings/BillingBankAccount.vue';
import WithdrawalInfo from '~/components/partials/billings/WithdrawalInfo.vue';

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');

interface BillingSummary {
  gross_sales: number
  nett_sales: number
  total_withdrawn: number
  withdrawable: number
  fee_percentage: string
}

// Round percentage to 0 decimal places
const roundPercentage = (value: string): string => {
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? '0' : Math.round(num).toString();
};

// Define the cards data structure
const getCardData = (summaryData: BillingSummary) => [
  {
    color: 'text-green-500',
    icon: 'solar:graph-up-bold-duotone',
    is_currency: true,
    title: 'Gross Sales',
    value: summaryData.gross_sales,
  },
  {
    color: 'text-blue-500',
    icon: 'solar:wallet-money-bold-duotone',
    is_currency: true,
    subtitle: `After ${roundPercentage(summaryData.fee_percentage)}% fee`,
    title: 'Nett Sales',
    value: summaryData.nett_sales,
  },
  {
    color: 'text-orange-500',
    icon: 'solar:card-transfer-bold-duotone',
    is_currency: true,
    title: 'Total Withdrawn',
    value: summaryData.total_withdrawn,
  },
  {
    color: 'text-purple-500',
    icon: 'solar:dollar-minimalistic-bold-duotone',
    is_currency: true,
    title: 'Balance',
    value: summaryData.withdrawable,
  },
];

// Fetch billing summary data
const getBillingSummary = async (evtId: Ref): Promise<BillingSummary> => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId.value}/billings-summary`);
  return response.data;
};

const { data, isError, isLoading, isRefetching } = useQuery({
  enabled: !!eventId,
  queryFn: () => getBillingSummary(eventId),
  queryKey: ['billingSummary', eventId],
});

// Computed property for card data
const cards = computed(() => {
  if (!data.value)
    return [];
  return getCardData(data.value); // Direct access, no .data wrapper
});
</script>

<template>
  <div v-if="isLoading || isRefetching" class="grid grid-cols-12 gap-4">
    <Skeleton
      v-for="i in 4"
      :key="i"
      class="col-span-12 h-28 rounded-xl bg-muted-foreground/10 sm:col-span-6 md:col-span-3"
    />
  </div>
  <div v-else-if="isError" class="py-16">
    <div class="flex h-32 items-center justify-center">
      Error fetching billing summary. Please try again later.
    </div>
  </div>
  <template v-else-if="data">
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
          <p v-if="item.subtitle" class="mt-1 text-xs text-muted-foreground">
            {{ item.subtitle }}
          </p>
        </CardContent>
      </Card>
      <BillingBankAccount class="lg:col-span-2" />
      <WithdrawalInfo class="lg:col-span-2" />
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
