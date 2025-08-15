<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationData } from '~/types';

import CopyButton from '@/components/CopyButton.vue';

interface Props {
  lookupResult: RegistrationData
}

const props = defineProps<Props>();

const attendeeCardValue = computed(() => {
  const attendee = props.lookupResult.attendee;
  const specialAttendee = props.lookupResult.special_attendee;

  const baseData: Record<string, any>[] = [
    { field: 'Full Name', value: attendee.fullname },
    { field: 'Email', value: attendee.email },
    { field: 'Phone', value: attendee.phone || 'N/A' },
    { field: 'Ticket', value: props.lookupResult.ticket.name },
    { field: 'Code', value: props.lookupResult.code },
    { field: 'Price', value: formatCurrency(props.lookupResult.ticket.price) },
  ];

  // Add VIP status and notes if special attendee data exists
  if (specialAttendee) {
    // Only show VIP status if actually VIP
    if (specialAttendee.is_vip) {
      baseData.splice(2, 0, {
        field: 'VIP Status',
        value: 'VIP',
        isVip: true,
      });
    }

    if (specialAttendee.notes) {
      baseData.push({
        field: 'Staff Notes',
        value: specialAttendee.notes,
        isNotes: true,
      });
    }
  }

  return baseData;
});

const attendeeCardColumns = [
  { key: 'field', label: 'Field', class: 'w-32' },
  { key: 'value', label: 'Value' },
];
</script>

<template>
  <TableCard
    title="Attendee Details"
    :data="attendeeCardValue"
    :columns="attendeeCardColumns"
    :show-table-header="false"
  >
    <!-- Style the field names (left column) -->
    <template #cell-field="{ value }">
      <span class="font-medium text-muted-foreground">{{ value }}</span>
    </template>

    <!-- Style the values (right column) -->
    <template #cell-value="{ item, value }">
      <div v-if="item.field === 'Code'" class="relative inline-flex items-center">
        <Badge
          variant="outline"
          class="text-md number select-all rounded-full border border-muted-foreground font-medium tabular-nums"
        >
          {{ value }}
        </Badge>
        <CopyButton
          :value="value"
          text="Copy code"
          button-class="text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100"
          side="top"
        />
      </div>
      <span v-else-if="item.field === 'Price'" class="font-semibold text-green-500">
        {{ value }}
      </span>
      <Badge v-else-if="item.field === 'Status'" :variant="value === 'Approved' ? 'default' : 'secondary'">
        {{ value }}
      </Badge>
      <div v-else-if="item.field === 'VIP Status'" class="flex items-center gap-2">
        <Badge
          :variant="item.isVip ? 'default' : 'secondary'"
          :class="item.isVip ? 'bg-amber-500 text-white' : ''"
        >
          <Icon
            v-if="item.isVip"
            icon="solar:crown-bold"
            class="mr-1 size-3"
          />
          {{ value }}
        </Badge>
      </div>
      <div v-else-if="item.field === 'Staff Notes'" class="max-w-xs">
        <div class="rounded-md bg-blue-50 p-2 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          <Icon icon="solar:note-bold" class="mr-1 inline size-3" />
          {{ value }}
        </div>
      </div>
      <span v-else class="font-medium">{{ value }}</span>
    </template>
  </TableCard>
</template>
