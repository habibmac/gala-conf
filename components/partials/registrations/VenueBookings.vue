<!-- components/VenueBookings.vue -->
<script setup lang="ts">
// Script section
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import BookingPopover from './BookingPopover.vue';
import type { VenueLayout, VenueData, Seat } from '@/types';

// State
const selectedSeat = ref<string | null>(null);

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');
const { $galantisApi } = useNuxtApp();

// Query to fetch venue data
const {
  data: venueData,
  error,
  isLoading,
} = useQuery<VenueData>({
  queryKey: ['venue-data', eventId],
  queryFn: ({ signal }) =>
    $galantisApi.get(`/event/${eventId.value}/venue/layout`, { signal }).then((response) => response.data),
});

// Computed
const gridElements = computed(() => {
  if (!venueData.value?.layout) return [];

  const elements = [];
  const { width, height } = venueData.value.layout.layout;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      elements.push({ row, col });
    }
  }

  return elements;
});

// Helper functions
// Then in your isStagePosition function:
function getStageStart(layout: VenueLayout): number {
  return Math.floor((layout.layout.width - layout.layout.stage.width) / 2);
}

function isStagePosition(row: number, col: number): boolean {
  if (!venueData.value?.layout) return false;

  const stage = venueData.value.layout.layout.stage;
  const stageStart = getStageStart(venueData.value.layout);

  return row < stage.rows && col >= stageStart && col < stageStart + stage.width;
}

function getSeatAtPosition(row: number, col: number) {
  return venueData.value?.layout?.seats.find((seat) => seat.row === row && seat.col === col);
}

function isAisle(col: number): boolean {
  return venueData.value?.layout?.layout.aisles.some((aisle) => aisle.afterCol === col) ?? false;
}

function handleSeatClick(seat: ReturnType<typeof getSeatAtPosition>) {
  if (!seat) return;
  selectedSeat.value = selectedSeat.value === seat.code ? null : seat.code;
}
</script>

<template>
  <ClientOnly>
    <Card v-if="venueData?.has_seating">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-base font-semibold">Venue Layout</CardTitle>
      </CardHeader>

      <CardContent>
        <div v-if="isLoading" class="flex justify-center items-center min-h-[200px]">
          <SpinnerRing />
        </div>

        <div v-else-if="error" class="text-destructive text-sm">Failed to load venue layout</div>

        <div v-else-if="venueData?.layout" class="overflow-x-auto">
          <div class="ee-seat-booking-wrapper">
            <div
              v-if="venueData?.layout"
              class="venue-grid"
              :style="{
                'grid-template-columns': `repeat(${venueData.layout.layout.width}, 1fr)`,
                width: '100%',
                'max-width': '1200px',
              }"
            >
              <!-- Stage -->
              <div
                class="venue-stage"
                :style="{
                  'grid-column': `${getStageStart(venueData.layout) + 1} / span ${venueData.layout.layout.stage.width}`,
                  'grid-row': `1 / span ${venueData.layout.layout.stage.rows}`,
                }"
              >
                STAGE
              </div>

              <!-- Seats Grid -->
               <template v-for="row in venueData.layout.layout.height" :key="row">
                <template v-for="col in venueData.layout.layout.width" :key="`${row}-${col}`">
                  <div
                    v-if="!isStagePosition(row - 1, col - 1)"
                    :class="[
                      'grid-cell',
                      { 'venue-aisle': isAisle(col - 1) }
                    ]"
                  >
                    <template v-if="getSeatAtPosition(row - 1, col - 1)">
                      <BookingPopover 
                        :seat="getSeatAtPosition(row - 1, col - 1)"
                        :selected="selectedSeat === getSeatAtPosition(row - 1, col - 1)?.code"
                        @select="handleSeatClick"
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

<style scoped>
.venue-grid {
  display: grid;
  gap: 5px;
  padding: 20px;
}

.venue-stage {
  background: #9dacbc;
  color: white;
  padding: 15px;
  text-align: center;
  border-radius: 4px;
}

.grid-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.venue-seat {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.venue-seat.vip {
  background: #f0f8ff;
  border-color: #4a90e2;
}

.venue-seat.selected {
  background: #00d35b;
  color: white;
}

.venue-aisle {
  margin-right: 20px;
}
</style>
