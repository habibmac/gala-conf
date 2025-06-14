<script setup lang="ts">
import { ref } from 'vue';

import type { EvtDatetime } from '~/types';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const props = defineProps<{
  datetimes: EvtDatetime[] | null
  selectedDatetime: string
}>();

const emit = defineEmits<{
  'update:selectedDatetime': [value: string]
}>();

const datetimesRef = ref<EvtDatetime[] | null>(props.datetimes);

watch(() => props.datetimes, (newDatetime) => {
  datetimesRef.value = newDatetime;
  nextTick(() => {
    if (datetimesRef.value && datetimesRef.value.length > 0
    ) {
      emit('update:selectedDatetime', datetimesRef.value[0].id);
    }
  });
}, { immediate: true });

const selectedDatetimeRef = ref(props.selectedDatetime);

watch(selectedDatetimeRef, (newValue) => {
  emit('update:selectedDatetime', newValue);
});
</script>

<template>
  <div class="grid grid-cols-1 items-center gap-2">
    <Label class="shrink-0">
      <span class="text-sm font-medium">Select Session</span>
    </Label>
    <Select
      :model-value="selectedDatetimeRef"
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
              v-if="datetime.date_start"
              class="text-sm text-muted-foreground"
            >
              {{ formatDate(datetime.date_start, 'dd MMM yyyy HH:mm') }}
            </span>
            <span
              v-if="datetime.date_end"
              class="text-sm text-muted-foreground"
            >
              - {{ formatDate(datetime.date_end, 'dd MMM yyyy HH:mm') }}
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
