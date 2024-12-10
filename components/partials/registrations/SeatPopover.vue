<script setup lang="ts">
import { PopoverRoot, PopoverTrigger, PopoverContent, PopoverPortal, PopoverArrow } from 'radix-vue';
import { ref, watch } from 'vue';
import { Badge } from '@/components/ui/badge';
import type { Seat } from '@/types';

const props = defineProps({
  seat: {
    type: Object as PropType<Seat>,
    default: null,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  select: [seat: Seat | null];
  close: [];
}>();

// Use modelValue for controlled state
const open = ref(props.isOpen);

watch(
  () => props.isOpen,
  (newVal) => {
    open.value = newVal;
  }
);

const isForSale = computed(() => {
  return props.seat?.is_for_sale;
});

const hasBookings = computed(() => {
  return props.seat?.bookings && props.seat.bookings.length > 0;
});

const bookingInfo = computed(() => {
  if (!props.seat?.bookings) return null;
  return {
    count: props.seat.bookings.length,
    attendees: props.seat.bookings,
  };
});

const handleClick = () => {
  if (!isForSale.value) return;
  if (!hasBookings.value) return;
  emit('select', props.seat);
};

const handleOpenChange = (value: boolean) => {
  if (!value) {
    emit('close');
  }
};
</script>

<template>
  <PopoverRoot v-if="seat" :open="open" @update:open="handleOpenChange">
    <PopoverTrigger
      :class="[
        'seat',
        {
          'bg-emerald-300 dark:bg-emerald-400': hasBookings,
          'border-primary text-primary': selected,
        },
      ]"
      @click="handleClick"
    >
      {{ seat.code }}
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        v-if="hasBookings && bookingInfo"
        class="z-50 bg-card border rounded-md shadow-lg w-80 p-4"
        side="top"
        :side-offset="5"
        align="center"
      >
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium">Seat {{ seat.code }}</h4>
          <Badge variant="outline" class="text-xs">
            {{ seat.type.toUpperCase() }}
          </Badge>
        </div>

        <div class="space-y-3">
          <div class="border-b last:border-0 pb-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium">Bookings</span>
              <Badge class="text-xs">
                {{ bookingInfo.count }} {{ bookingInfo.count === 1 ? 'booking' : 'bookings' }}
              </Badge>
            </div>

            <ul class="space-y-2">
              <li
                v-for="(attendee, idx) in bookingInfo.attendees"
                :key="idx"
                class="text-sm text-muted-foreground flex items-center gap-2"
              >
                <span class="i-lucide-user h-4 w-4" />
                {{ attendee.name }}
              </li>
            </ul>
          </div>
        </div>
        <PopoverArrow class="fill-card z-50" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
