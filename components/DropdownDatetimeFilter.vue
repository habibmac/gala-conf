<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/utils';

interface DatetimeOption {
  id: string
  name: string
  date_start: string
  date_end: string
  sold?: number
  reg_limit?: number
}

interface Props {
  datetimes: DatetimeOption[]
  selectedDatetime: string
  isLoading?: boolean
  placeholder?: string
  showAllOption?: boolean
  allOptionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select session...',
  showAllOption: true,
  allOptionLabel: 'All Sessions',
  isLoading: false,
});

const emit = defineEmits<{
  'update:selectedDatetime': [value: string]
}>();

const displayValue = computed(() => {
  if (!props.selectedDatetime)
    return props.allOptionLabel;

  const datetime = props.datetimes.find(dt => dt.id === props.selectedDatetime);
  if (!datetime)
    return props.allOptionLabel;

  return `${datetime.name} (${formatDate(datetime.date_start, 'dd MMM yyyy HH:mm')} - ${formatDate(datetime.date_end, 'HH:mm')})`;
});

const handleDatetimeChange = (value: string) => {
  const actualDatetimeId = value === 'all' ? '' : value;
  emit('update:selectedDatetime', actualDatetimeId);
};
</script>

<template>
  <div class="flex items-center gap-2">
    <Select :model-value="selectedDatetime || 'all'" :disabled="isLoading" @update:model-value="handleDatetimeChange">
      <SelectTrigger class="bg-card">
        <SelectValue>
          <span v-if="isLoading">Loading...</span>
          <div v-else class="flex items-center gap-2">
            <Icon icon="tabler:calendar" class="size-4 text-muted-foreground" />
            <span>{{ displayValue }}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-if="showAllOption" value="all">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ allOptionLabel }}</span>
          </div>
        </SelectItem>

        <SelectItem v-for="datetime in datetimes" :key="datetime.id" :value="datetime.id">
          <div class="flex flex-col">
            <span class="font-medium">{{ datetime.name }}</span>
            <span class="text-xs text-muted-foreground">
              {{ formatDate(datetime.date_start, 'dd MMM yyyy HH:mm') }} -
              {{ formatDate(datetime.date_end, 'HH:mm') }}
            </span>
            <span v-if="datetime.sold !== undefined" class="text-xs text-muted-foreground">
              {{ datetime.sold }} registered
              <span v-if="datetime.reg_limit && datetime.reg_limit !== Infinity">
                of {{ datetime.reg_limit }}
              </span>
            </span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
