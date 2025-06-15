<script setup lang="ts">
import type { RegistrationData } from '~/types';

interface Props {
  lookupResult: RegistrationData
}

const props = defineProps<Props>();

const attendeeCardValue = computed(() => {
  const attendee = props.lookupResult.attendee;
  return [
    { field: 'Full Name', value: attendee.fullname },
    { field: 'Email', value: attendee.email },
    { field: 'Phone', value: attendee.phone || 'N/A' },
    { field: 'Ticket', value: props.lookupResult.ticket.name },
    { field: 'Code', value: props.lookupResult.code },
    { field: 'Price', value: formatCurrency(props.lookupResult.ticket.price) },
  ];
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
      <div v-if="item.field === 'Code'" class="relative inline-block">
        <Badge
          variant="outline"
          class="text-md number select-all rounded-full border border-muted-foreground font-medium tabular-nums"
        >
          {{ value }}
        </Badge>
        <CopyButton
          :value="value"
          text="Copy code"
          button-class="hidden md:absolute -right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100"
          side="top"
        />
      </div>
      <span v-else-if="item.field === 'Price'" class="font-semibold text-green-500">
        {{ value }}
      </span>
      <Badge v-else-if="item.field === 'Status'" :variant="value === 'Approved' ? 'default' : 'secondary'">
        {{ value }}
      </Badge>
      <span v-else class="font-medium">{{ value }}</span>
    </template>
  </TableCard>
</template>
