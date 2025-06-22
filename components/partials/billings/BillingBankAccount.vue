<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';

import { Skeleton } from '@/components/ui/skeleton';

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');

interface BillingBankAccount {
  bank_name: string
  bank_account: string
  account_holder?: string
}

// Fetch bank accounts data
const getBankAccounts = async (evtId: Ref) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId.value}/billings/bank-account`);
  return response.data as BillingBankAccount;
};

const { data: bankAccount, isError, isLoading, isRefetching } = useQuery({
  enabled: !!eventId,
  queryFn: () => getBankAccounts(eventId),
  queryKey: ['bankAccount', eventId],
});
</script>

<template>
  <div v-if="isLoading || isRefetching">
    <Skeleton class="h-28 rounded-xl bg-muted-foreground/10 sm:col-span-6 md:col-span-3" />
  </div>
  <div v-else-if="isError" class="py-16">
    <div class="flex h-32 items-center justify-center">
      Error fetching bank account details. Please try again later.
    </div>
  </div>
  <template v-else-if="bankAccount">
    <Card
      class="group relative overflow-hidden border-l-4 border-l-blue-500 transition-all duration-200 hover:shadow-md"
    >
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold">
              Bank Account
            </h2>
            <p class="text-sm text-muted-foreground">
              This is the bank account linked to your event for receiving payments.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          class="max-w-md rounded-lg border border-blue-100 bg-gradient-to-br from-blue-100 via-white to-indigo-100 p-4 dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50"
        >
          <div class="flex items-center justify-between space-x-2">
            <div class="space-y-1">
              <p class="font-mono text-lg tracking-wider">
                {{ bankAccount.bank_account }}
              </p>
              <span class="text-sm">
                {{ bankAccount.account_holder || 'Account Holder Not Specified' }}
              </span>
            </div>
            <img
              :src="`/images/banks/${bankAccount.bank_name.toLowerCase().replace(/\s+/g, '-')}.svg`"
              alt="Bank Icon"
              class="h-8"
            >
          </div>
        </div>
      </CardContent>
    </Card>
  </template>
  <template v-else>
    <div class="mx-auto w-full">
      <EmptyState
        title="No bank account linked"
        description="There is no bank account linked for this event. Please contact us to set one up."
        :img="{ src: '/images/empty-state/no-data.svg', alt: 'No data' }"
      />
    </div>
  </template>
</template>
