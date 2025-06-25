<!-- components/partials/registration-details/TransactionInfoCard.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationDetails } from '~/types';

import PayMethodLogo from '@/components/partials/registrations/PayMethodLogo.vue';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils';

interface Props {
  registration: RegistrationDetails
}

const props = defineProps<Props>();

const remainingAmount = computed(() => {
  return props.registration.txn.total - props.registration.txn.paid;
});
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Icon icon="solar:bill-list-bold-duotone" class="size-5 text-fuchsia-500" />
        Transaction Information
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Transaction ID -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">Transaction ID</span>
        <span class="font-mono text-sm">{{ registration.txn.id }}</span>
      </div>

      <!-- Group Size -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">Group Size</span>
        <Badge variant="outline">
          {{ registration.txn.size }} {{ registration.txn.size > 1 ? 'people' : 'person' }}
        </Badge>
      </div>

      <!-- Payment Method -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">Payment Method</span>
        <div class="flex items-center gap-2">
          <PayMethodLogo :pay-method="registration.txn.pay_method" />
          <span class="text-sm">{{ registration.txn.pay_method }}</span>
        </div>
      </div>

      <Separator />

      <!-- Financial Summary -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Total Amount</span>
          <span class="text-lg font-semibold">{{ formatCurrency(registration.txn.total) }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Paid Amount</span>
          <span class="text-lg font-semibold text-green-600">{{ formatCurrency(registration.txn.paid) }}</span>
        </div>

        <div v-if="remainingAmount > 0" class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Remaining</span>
          <span class="text-lg font-semibold text-red-600">{{ formatCurrency(remainingAmount) }}</span>
        </div>

        <div class="flex items-center justify-between border-t pt-2">
          <span class="text-sm font-medium text-muted-foreground">Status</span>
          <Badge :variant="registration.txn.is_complete ? 'default' : 'destructive'">
            {{ registration.txn.status }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
