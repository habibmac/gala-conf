<!-- components/SeatBookings.vue -->
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
// Script section
import { ref } from 'vue';

import type { SeatData, SeatItem, SeatLayout } from '@/types';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import SeatPopover from './SeatPopover.vue';

// State
const selectedSeat = ref<string | null>(null);
const openPopoverSeat = ref<string | null>(null);

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');
const { $galantisApi } = useNuxtApp();
const selectedDay = ref<string | undefined>('1'); // Initialize with '1' instead of 1

// Query to fetch seat data
const {
  data: seatData,
  error,
  isLoading,
} = useQuery<SeatData>({
  queryFn: ({ signal }) =>
    $galantisApi
      .get(`/event/${eventId.value}/seat-bookings/layout`, {
        params: {
          day: Number.parseInt(selectedDay.value || '1', 10),
        },
        signal,
      })
      .then(response => response.data?.data),
  queryKey: ['seat-data', eventId, selectedDay],
});

// Helper functions
function getStageStart(layout: SeatLayout): number {
  return Math.floor((layout.width - layout.stage.width) / 2);
}

function isStagePosition(row: number, col: number): boolean {
  if (!seatData.value?.layout)
    return false;

  const stage = seatData.value.layout.stage;
  const stageStart = getStageStart(seatData.value.layout);

  return (
    row < stage.startRow + stage.rows && row >= stage.startRow && col >= stageStart && col < stageStart + stage.width
  );
}

function getSeatAtPosition(row: number, col: number) {
  return seatData.value?.seats.find(seat => seat.row === row && seat.col === col);
}

function isAisle(col: number): boolean {
  return seatData.value?.layout.aisles.some(aisle => aisle.afterCol === col) ?? false;
}

function handleSeatClick(seat: SeatItem | null) {
  if (!seat)
    return;

  if (selectedSeat.value === seat.code) {
    // If clicking the same seat, close everything
    selectedSeat.value = null;
    openPopoverSeat.value = null;
  }
  else {
    // If clicking a new seat, select it and open its popover
    selectedSeat.value = seat.code;
    openPopoverSeat.value = seat.code;
  }
}

function handlePopoverClose() {
  openPopoverSeat.value = null;
}
</script>

<template>
  <ClientOnly>
    <Card v-if="seatData">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-lg font-semibold">
          Venue Layout
        </CardTitle>
        <Select v-model="selectedDay">
          <SelectTrigger class="w-auto">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              <SelectLabel>Event Days</SelectLabel>
              <SelectItem v-for="scope in seatData?.ticket_scopes" :key="scope.id" :value="scope.day.toString()">
                {{ scope.name }} ({{ scope.start }})
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="flex min-h-[200px] items-center justify-center">
          <SpinnerRing />
        </div>

        <div v-else-if="error" class="text-sm text-destructive">
          Failed to load seats layout
        </div>

        <div v-else class="overflow-x-auto">
          <div class="rounded-lg bg-background/5">
            <div
              v-if="seatData?.layout"
              class="grid min-w-full gap-2 p-4"
              :style="{
                'grid-template-columns': `repeat(${seatData.layout.width}, minmax(40px, 1fr))`,
                'width': '100%',
                'max-width': '1200px',
              }"
            >
              <!-- Stage -->
              <div
                class="flex items-center justify-center rounded-lg bg-accent tracking-wider text-muted-foreground"
                :style="{
                  'grid-column': `${getStageStart(seatData.layout) + 1} / span ${seatData.layout.stage.width}`,
                  'grid-row': `1 / span ${seatData.layout.stage.rows}`,
                }"
              >
                STAGE
              </div>

              <!-- Seats Grid -->
              <template v-for="row in seatData.layout.height" :key="row">
                <template v-for="col in seatData.layout.width" :key="`${row}-${col}`">
                  <div v-if="!isStagePosition(row, col)" class="aspect-square" :class="[{ 'seat-aisle': isAisle(col) }]">
                    <template v-if="getSeatAtPosition(row, col)">
                      <SeatPopover
                        :seat="getSeatAtPosition(row, col)"
                        :selected="selectedSeat === getSeatAtPosition(row, col)?.code"
                        :is-open="openPopoverSeat === getSeatAtPosition(row, col)?.code"
                        @select="handleSeatClick"
                        @close="handlePopoverClose"
                      />
                    </template>
                    <div v-else class="size-full" />
                  </div>
                </template>
              </template>
            </div>
          </div>
          <!-- Legend -->
          <div class="mt-4 flex justify-center gap-4 text-xs">
            <div v-for="item in seatData?.legend" :key="item.name" class="flex items-center gap-2">
              <div
                class="size-4 rounded-sm"
                :class="{
                  'border border-primary bg-primary/10': item.class === '1',
                  'border border-border bg-background': item.class === '2',
                }"
              />
              <span>{{ item.display_name }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </ClientOnly>
</template>

<style lang="scss">
.seat {
  contain: layout style paint;
}

.venue-grid {
  contain: strict;
  will-change: transform;
}
</style>
