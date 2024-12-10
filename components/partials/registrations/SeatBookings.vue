<!-- components/VenueBookings.vue -->
<script setup lang="ts">
// Script section
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import SeatPopover from './SeatPopover.vue';
import type { SeatLayout, SeatData, Seat } from '@/types';

// State
const selectedSeat = ref<string | null>(null);
const openPopoverSeat = ref<string | null>(null);

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');
const { $galantisApi } = useNuxtApp();

// Query to fetch seat data
const {
  data: seatData,
  error,
  isLoading,
} = useQuery<SeatData>({
  queryKey: ['seat-data', eventId],
  queryFn: ({ signal }) =>
    $galantisApi.get(`/event/${eventId.value}/seat-bookings/layout`, { signal }).then((response) => response.data),
});

// Computed
const gridElements = computed(() => {
  if (!seatData.value?.layout) return [];

  const elements = [];
  const { width, height } = seatData.value.layout;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      elements.push({ row, col });
    }
  }

  return elements;
});

// Helper functions
// Then in your isStagePosition function:
function getStageStart(layout: SeatLayout): number {
  return Math.floor((layout.width - layout.stage.width) / 2);
}

function isStagePosition(row: number, col: number): boolean {
  if (!seatData.value?.layout) return false;

  const stage = seatData.value.layout.stage;
  const stageStart = getStageStart(seatData.value.layout);

  return row < stage.rows && col >= stageStart && col < stageStart + stage.width;
}

function getSeatAtPosition(row: number, col: number) {
  return seatData.value?.seats.find((seat) => seat.row === row && seat.col === col);
}

function isAisle(col: number): boolean {
  return seatData.value?.layout.aisles.some((aisle) => aisle.afterCol === col) ?? false;
}

function handleSeatClick(seat: Seat | null) {
  if (!seat) return;

  if (selectedSeat.value === seat.code) {
    // If clicking the same seat, close everything
    selectedSeat.value = null;
    openPopoverSeat.value = null;
  } else {
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
    <Card v-if="seatData?.has_seating">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-lg font-semibold">Venue Layout</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="flex justify-center items-center min-h-[200px]">
          <SpinnerRing />
        </div>

        <div v-else-if="error" class="text-destructive text-sm">Failed to load seats layout</div>

        <div v-else-if="seatData?.layout" class="overflow-x-auto">
          <div class="bg-background/5 rounded-lg">
            <div
              v-if="seatData?.layout"
              class="grid gap-2 min-w-full"
              :style="{
                'grid-template-columns': `repeat(${seatData.layout.width}, minmax(40px, 1fr))`,
                width: '100%',
                'max-width': '1200px',
              }"
            >
              <!-- Stage -->
              <div
                class="flex items-center justify-center bg-accent rounded-lg text-muted-foreground tracking-wider"
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
                  <div
                    v-if="!isStagePosition(row - 1, col - 1)"
                    :class="['aspect-square', { 'seat-aisle': isAisle(col - 1) }]"
                  >
                    <template v-if="getSeatAtPosition(row - 1, col - 1)">
                      <!-- if not for sale -->
                      <!-- <div v-if="!getSeatAtPosition(row - 1, col - 1)?.is_for_sale" class="seat">
                        {{ getSeatAtPosition(row - 1, col - 1)?.code }}
                      </div> -->

                      <SeatInactive v-if="!getSeatAtPosition(row - 1, col - 1)?.is_for_sale" />

                      <SeatPopover
                        v-else
                        :seat="getSeatAtPosition(row - 1, col - 1)"
                        :selected="selectedSeat === getSeatAtPosition(row - 1, col - 1)?.code"
                        :is-open="openPopoverSeat === getSeatAtPosition(row - 1, col - 1)?.code"
                        @select="handleSeatClick"
                        @close="handlePopoverClose"
                      />
                    </template>
                    <div v-else class="w-full h-full" />
                  </div>
                </template>
              </template>
            </div>
          </div>
          <!-- Legend -->
          <div class="flex gap-4 justify-center mt-4 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-primary/10 border border-primary rounded-sm" />
              <span>VIP</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-background border border-border rounded-sm" />
              <span>Premium</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </ClientOnly>
</template>

<style lang="scss">
.seat {
  @apply select-none border text-sm h-full w-full flex items-center justify-center rounded-xl transition-colors duration-200 border-border;
}
</style>
