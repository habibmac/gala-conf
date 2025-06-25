<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { getStatusInfo } from '@/utils/status-map';
import StatusBadge from '~/components/statuses/StatusBadge.vue';

interface Props {
  ticket: any
  isUpdatingOrder: boolean
  isExpanded: boolean
}
const props = defineProps<Props>();

defineEmits<{
  edit: [ticketId: string]
  duplicate: [ticket: any]
  delete: [ticket: any]
}>();

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Get ticket status configuration from centralized utility
const ticketStatusConfig = computed(() => {
  const statusCode = props.ticket.status_code || 'TKO'; // Default to 'On Sale'
  return getStatusInfo(statusCode);
});

const regStatusEntries = computed(() => {
  if (!props.ticket.sales_stats?.by_status)
    return [];

  // Define the desired order using status codes
  const statusOrder = ['RAP', 'RPP', 'RCN', 'RIC']; // Approved, Pending, Cancelled, Incomplete, etc.

  const entries = Object.entries(props.ticket.sales_stats.by_status).map(([status, count]) => ({
    status: String(status),
    count,
    info: getStatusInfo(String(status)),
  }));

  // Sort based on the defined order
  return entries.sort((a, b) => {
    const indexA = statusOrder.indexOf(a.status);
    const indexB = statusOrder.indexOf(b.status);

    // If status not found in order array, put it at the end
    const orderA = indexA === -1 ? statusOrder.length : indexA;
    const orderB = indexB === -1 ? statusOrder.length : indexB;

    return orderA - orderB;
  });
});
</script>

<template>
  <Card
    class="group relative border-l-4 transition-all duration-200 hover:shadow-md"
    :class="[
      ticketStatusConfig.borderColor]"
  >
    <CardContent class="relative p-4 pl-6">
      <div class="flex items-start justify-between">
        <!-- Drag Handle, only on hover -->
        <div
          class="mr-3 flex flex-col items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <Button
            variant="ghost"
            size="icon"
            class="drag-handle absolute left-1 top-2 cursor-grab hover:cursor-grabbing hover:bg-transparent"
            :disabled="isUpdatingOrder"
            alt="Drag to reorder ticket"
          >
            <Icon icon="mdi:drag" class="size-6" />
          </Button>
        </div>

        <!-- Ticket Info -->
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between">
            <div class="flex-1 pr-4 md:pr-0">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge :status-id="ticket.status_code || 'TKO'" variant="badge" size="sm" />
                <h4 class="max-w-xs text-base font-semibold sm:max-w-none">
                  {{ ticket.name }}
                </h4>
              </div>

              <p v-if="ticket.description" class="mb-3 line-clamp-2 text-sm text-muted-foreground">
                {{ ticket.description }}
              </p>

              <!-- Stats Grid -->
              <div class="mb-3 grid grid-cols-4 gap-4 md:grid-cols-4">
                <div class="col-span-2">
                  <div class="text-lg font-bold text-primary">
                    {{ formatCurrency(ticket.price) }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    Price
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold">
                    {{ ticket.quantity === null ? '∞' : formatThousands(ticket.quantity) }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    Quota
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold text-emerald-400">
                    {{ ticket.sold || 0 }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    Sold
                  </div>
                </div>
              </div>

              <div v-if="isExpanded" class="space-y-3">
                <!-- Registration Status Breakdown -->
                <div v-if="ticket.sales_stats?.by_status" class="mb-3">
                  <div class="flex flex-wrap gap-2">
                    <StatusBadge
                      v-for="item in regStatusEntries"
                      :key="item.status"
                      :status-id="item.status"
                      variant="pill"
                      size="sm"
                      :custom-content="true"
                    >
                      {{ item.info.label }}: {{ item.count }}
                    </StatusBadge>
                  </div>
                </div>
                <!-- Associated Sessions -->
                <div v-if="ticket.datetimes?.length" class="mb-3">
                  <div class="mb-1 text-xs text-muted-foreground">
                    Sessions:
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <Badge
                      v-for="datetime in ticket.datetimes"
                      :key="datetime.id"
                      variant="secondary"
                      class="text-xs"
                    >
                      {{ datetime.name }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions - Always visible on mobile, hover on desktop -->
            <div class="">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon">
                    <Icon icon="tabler:dots-vertical" class="size-4" />
                    <span class="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem @click="$emit('edit', ticket.id)">
                    <Icon icon="tabler:pencil" class="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="$emit('duplicate', ticket)">
                    <Icon icon="tabler:copy" class="mr-2 size-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click="$emit('delete', ticket)">
                    <Icon icon="tabler:trash" class="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
