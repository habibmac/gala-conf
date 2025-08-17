<script setup lang="ts">
import type { RegistrationData } from '~/types';

interface Props {
  lookupResult: RegistrationData
}

const props = defineProps<Props>();

const historyCardValue = computed(() => {
  if (!props.lookupResult.checkin_history || props.lookupResult.checkin_history.length === 0) {
    return [];
  }
  return props.lookupResult.checkin_history.map(item => ({
    action: item.status,
    timestamp: item.timestamp ? formatDate(item.timestamp, 'dd MMM yyyy HH:mm') : 'N/A',
    note: item.note || null,
  }));
});

const checkinCount = computed(() => {
  return props.lookupResult.checkin_count ? props.lookupResult.checkin_count : 0;
});

const historyCardColumns = [
  { key: 'action', label: 'Action', class: 'w-32' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'note', label: 'Note' },
];
</script>

<template>
  <TableCard
    title="Checkin History"
    :data="historyCardValue"
    :columns="historyCardColumns"
    :show-table-header="false"
    empty-message=""
    content-class="max-h-80 overflow-y-auto"
  >
    <template v-if="checkinCount" #headerAction>
      <Badge
        v-if="checkinCount"
        class="ml-2 flex h-6 min-w-6 shrink-0 scale-90 items-center justify-center rounded-full px-1.5 text-xs"
      >
        {{ checkinCount }}
      </Badge>
    </template>
    <template #cell-action="{ value }">
      <span
        class="font-medium"
        :class="{
          'text-green-600': value === 'Checked In',
          'text-red-600': value === 'Checked Out',
          'text-blue-600': value === 'Note Added',
        }"
      >
        {{ value }}
      </span>
    </template>

    <template #cell-timestamp="{ value }">
      <span class="text-sm text-muted-foreground">
        {{ value }}
      </span>
    </template>

    <template #cell-note="{ value }">
      <div v-if="value" class="flex items-start gap-2">
        <Icon icon="solar:note-bold" class="mt-0.5 size-3 shrink-0 text-blue-500" />
        <span class="break-words text-sm text-muted-foreground">
          {{ value }}
        </span>
      </div>
      <span v-else class="text-xs text-muted-foreground/50">
        -
      </span>
    </template>

    <!-- Custom empty state -->
    <template #empty>
      <div class="flex flex-col items-center justify-center py-2 text-center">
        <svg
          class="mb-4 size-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="font-medium text-muted-foreground">
          No Check-in History
        </h3>
        <p class="text-sm text-muted-foreground/80">
          This attendee hasn't checked in yet
        </p>
      </div>
    </template>
  </TableCard>
</template>
