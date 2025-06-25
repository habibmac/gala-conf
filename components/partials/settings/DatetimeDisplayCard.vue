<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { getStatusInfo } from '@/utils/status-map';
import StatusBadge from '~/components/statuses/StatusBadge.vue';

interface Props {
  session: any
  canEdit: boolean
  editWarning: string | null
  isUpdatingOrder?: boolean
}

const props = defineProps<Props>();

defineEmits<{
  edit: [sessionId: string]
  duplicate: [session: any]
  delete: [session: any]
}>();

// Get datetime status from centralized utility
const getDatetimeStatusCode = (session: any) => {
  const now = new Date();
  const startDate = new Date(session.date_start);
  const endDate = new Date(session.date_end);

  if (endDate < now) {
    return 'DTC'; // Completed
  }

  if (startDate <= now && endDate >= now) {
    return 'DTA'; // Active
  }

  return 'DTU'; // Upcoming
};

const datetimeStatusConfig = computed(() => {
  const statusCode = getDatetimeStatusCode(props.session);
  return getStatusInfo(statusCode);
});
</script>

<template>
  <Card
    class="group relative border-l-4 transition-all duration-200 hover:shadow-md"
    :class="[
      datetimeStatusConfig.borderColor || `border-l-${datetimeStatusConfig.dotClass.replace('bg-', '')}`,
    ]"
  >
    <CardContent class="p-4">
      <div class="flex items-start justify-between">
        <!-- Session Info -->
        <div class="min-w-0 flex-1">
          <div class="mb-2 flex items-center gap-2">
            <h4 class="truncate text-base font-semibold">
              {{ session.name }}
            </h4>
            <StatusBadge :status-id="getDatetimeStatusCode(session)" variant="badge" size="sm" />
          </div>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-center gap-2">
              <Icon icon="mdi:calendar" class="size-4" />
              <span>{{ formatDateRange(session.date_start, session.date_end) }}</span>
            </div>

            <div v-if="session.description" class="flex items-start gap-2">
              <Icon icon="mdi:text" class="mt-0.5 size-4" />
              <span class="line-clamp-2">{{ session.description }}</span>
            </div>

            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <Icon icon="mdi:account-group" class="size-4" />
                <span>{{ session.sold || 0 }} registered</span>
                <span v-if="session.reg_limit" class="text-muted-foreground">
                  / {{ session.reg_limit }} max
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon">
                <Icon icon="mdi:dots-vertical" class="size-4" />
                <span class="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-40">
              <DropdownMenuItem @click="$emit('edit', session.id)">
                <Icon icon="mdi:pencil" class="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem @click="$emit('duplicate', session)">
                <Icon icon="mdi:content-copy" class="mr-2 size-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                class="text-destructive focus:text-destructive"
                :disabled="!canEdit"
                @click="$emit('delete', session)"
              >
                <Icon icon="mdi:delete" class="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
