<script setup lang="ts">
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
  <div class="grid grid-cols-1 items-center gap-2">
    <Label class="shrink-0">
      <span class="text-sm font-medium">Select Session</span>
    </Label>
    <Select
      :model-value="selectedDatetime"
      @update:model-value="$emit('update:selectedDatetime', $event)"
    >
      <SelectTrigger class="h-14 bg-card dark:bg-background md:h-12">
        <SelectValue placeholder="Select a session" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem
          v-for="datetime in datetimesRef"
          :key="datetime.id"
          :value="datetime.id"
        >
          <div class="flex flex-row items-center gap-1">
            <span class="font-medium">{{ datetime.name }}</span>
            <span
              class="text-sm text-muted-foreground"
            >
              {{ formatDateRange(datetime.date_start, datetime.date_end) }}
            </span>
            <span
              v-if="datetime.available !== null"
              class="text-sm text-muted-foreground"
            >
              ({{ datetime.available }} available)
            </span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
