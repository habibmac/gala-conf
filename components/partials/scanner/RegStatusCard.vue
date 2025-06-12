<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { PaymentValidation, RegistrationValidation } from '~/types';

interface Props {
  registrationStatusInfo: RegistrationValidation
  paymentStatus: PaymentValidation | null
}

const props = defineProps<Props>();

const statusCardValue = computed(() => {
  const items = [];

  // Registration status
  items.push({
    field: 'Registration',
    value: props.registrationStatusInfo.status,
    status: props.registrationStatusInfo.status,
    icon: props.registrationStatusInfo.status === 'Approved' ? 'heroicons:check' : 'heroicons:x-mark',
  });

  // Payment status (only if payment is required)
  if (props.paymentStatus?.requiresPayment) {
    items.push({
      field: 'Payment',
      value: props.paymentStatus.isPaymentCompleted ? 'Complete' : 'Pending',
      status: props.paymentStatus.isPaymentCompleted ? 'complete' : 'pending',
      icon: props.paymentStatus.isPaymentCompleted ? 'heroicons:check' : 'heroicons:clock',
      message: props.paymentStatus.paymentMessage,
    });
  }

  return items;
});

const statusCardColumns = [
  { key: 'field', label: 'Status', class: 'w-32' },
  { key: 'value', label: 'Details' },
];

const hasPaymentWarning = computed(() => {
  return props.paymentStatus?.requiresPayment && !props.paymentStatus.isPaymentCompleted;
});
</script>

<template>
  <div class="space-y-4">
    <TableCard
      title="Status"
      :data="statusCardValue"
      :columns="statusCardColumns"
      :show-table-header="false"
    >
      <!-- Style the field names (left column) -->
      <template #cell-field="{ value }">
        <span class="font-medium text-muted-foreground">{{ value }}</span>
      </template>

      <!-- Style the status values (right column) -->
      <template #cell-value="{ item, value }">
        <div class="inline-flex items-center gap-1">
          <Icon
            :icon="item.icon"
            class="size-4"
            :class="{
              'text-green-500': item.status === 'checked-in' || item.status === 'complete' || item.status === 'Approved',
              'text-destructive': item.status === 'pending' || item.status === 'Pending Payment',
            }"
          />
          <span
            class="font-medium"
            :class="{
              'text-green-500': item.status === 'checked-in' || item.status === 'complete' || item.status === 'Approved',
              'text-destructive': item.status === 'pending' || item.status === 'Pending Payment',
            }"
          >
            {{ value }}
          </span>
        </div>
      </template>

      <template v-if="hasPaymentWarning" #tableFooter>
        <!-- Payment Warning Message (if needed) -->
        <div class="rounded-lg bg-amber-50 p-3 text-sm text-red-600">
          <Icon icon="heroicons:exclamation-triangle" class="mr-1 inline-block size-4" />
          Payment is required for this registration.
        </div>
      </template>
    </TableCard>
  </div>
</template>
