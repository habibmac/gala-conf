<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { format } from 'date-fns';

interface Props {
  session: any
  canEdit: boolean
  editWarning: string | null
  isUpdatingOrder?: boolean
}

defineProps<Props>();

defineEmits<{
  edit: [sessionId: string]
  duplicate: [session: any]
  delete: [session: any]
}>();

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  }
  catch {
    return dateString;
  }
};

const getStatusConfig = (session: any) => {
  const now = new Date();
  const startDate = new Date(session.date_start);
  const endDate = new Date(session.date_end);

  if (endDate < now) {
    return {
      color: 'border-l-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-950/20',
      textColor: 'text-gray-700 dark:text-gray-300',
      icon: 'mdi:check-circle',
      label: 'Completed',
    };
  }

  if (startDate <= now && endDate >= now) {
    return {
      color: 'border-l-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      textColor: 'text-green-700 dark:text-green-300',
      icon: 'mdi:play-circle',
      label: 'Active',
    };
  }

  return {
    color: 'border-l-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: 'mdi:clock',
    label: 'Upcoming',
  };
};
</script>

<template>
  <Card
    class="group relative border-l-4 transition-all duration-200 hover:shadow-md"
    :class="[
      getStatusConfig(session).color,
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
            <Badge :class="getStatusConfig(session).textColor" variant="secondary" class="text-xs">
              <Icon :icon="getStatusConfig(session).icon" class="mr-1 size-3" />
              {{ getStatusConfig(session).label }}
            </Badge>
          </div>

          <div class="mb-3 text-sm text-muted-foreground">
            <div class="flex items-center gap-2">
              <Icon icon="mdi:calendar" class="size-4" />
              <span>{{ formatDate(session.date_start) }} - {{ formatDate(session.date_end) }}</span>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-4">
            <div v-if="session.sold">
              <div class="text-lg font-bold text-green-600">
                {{ session.sold }}
              </div>
              <div class="text-xs text-muted-foreground">
                Registrations
              </div>
            </div>
            <div v-if="session.reg_limit">
              <div class="text-lg font-bold">
                {{ session.reg_limit }}
              </div>
              <div class="text-xs text-muted-foreground">
                Limit
              </div>
            </div>
          </div>

          <p v-if="session.description" class="mt-2 text-sm text-muted-foreground">
            {{ session.description }}
          </p>
        </div>

        <!-- Actions -->
        <div class="opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="size-8">
                <Icon icon="heroicons:ellipsis-vertical" class="size-4" />
                <span class="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-40">
              <DropdownMenuItem @click="$emit('edit', session.id)">
                <Icon icon="tabler:pencil" class="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem @click="$emit('duplicate', session)">
                <Icon icon="tabler:copy" class="mr-2 size-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem class="text-destructive focus:text-destructive" @click="$emit('delete', session)">
                <Icon icon="tabler:trash" class="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
