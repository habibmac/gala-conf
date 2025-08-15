<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

import type { EvtDatetime } from '~/types';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const props = defineProps<{
  datetimes: EvtDatetime[] | null
  selectedDatetime: string
}>();

defineEmits<{
  'update:selectedDatetime': [value: string]
}>();

const datetimesRef = ref<EvtDatetime[] | null>(props.datetimes);
</script>

<template>
  <Select :model-value="selectedDatetime" @update:model-value="$emit('update:selectedDatetime', $event)">
    <SelectTrigger class="h-10 w-full bg-card dark:bg-background">
      <SelectValue placeholder="Select a session">
        <div class="flex items-center gap-2 font-medium">
          <Icon icon="tabler:calendar" class="size-4 text-muted-foreground" />
          <span v-if="selectedDatetime">{{ datetimesRef?.find(d => d.id === selectedDatetime)?.name || 'Select Session'
          }}</span>
          <span v-else>{{ 'Select Session' }}</span>
        </div>
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="datetime in datetimesRef"
        :key="datetime.id"
        :value="datetime.id"
        class="px-4 py-3"
      >
        <div>
          <div class="font-medium">
            {{ datetime.name }}
          </div>
          <div class="mt-1 text-xs text-muted-foreground">
            {{ formatDateRange(datetime.date_start, datetime.date_end) }}
            <span v-if="datetime.available !== null"> • {{ datetime.available }} available</span>
          </div>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
