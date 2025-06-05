<script setup lang="ts">
import { arrow, flip, offset, shift, useFloating } from '@floating-ui/vue';
import { Icon } from '@iconify/vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type { SeatItem } from '@/types';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const props = defineProps({
  isOpen: {
    default: false,
    type: Boolean,
  },
  seat: {
    default: null,
    type: Object as PropType<SeatItem>,
  },
  selected: {
    default: false,
    type: Boolean,
  },
});

const emit = defineEmits<{
  select: [seat: SeatItem | null]
  close: []
}>();

const open = ref(props.isOpen);
const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);

const {
  middlewareData,
  placement: floatingPlacement, // rename to avoid conflicts
  strategy,
  x,
  y,
} = useFloating(reference, floating, {
  middleware: [offset(12), flip({ padding: 8 }), shift({ padding: 8 }), arrow({ element: arrowRef })],
  placement: 'top',
});

const floatingStyles = computed(() => {
  const styles: Record<string, string> = {
    position: strategy.value,
  };

  if (x.value != null) {
    styles.left = `${x.value}px`;
  }

  if (y.value != null) {
    styles.top = `${y.value}px`;
  }

  return styles;
});

const currentPlacement = computed(() => floatingPlacement.value || 'top');

const arrowStyles = computed(() => {
  if (!middlewareData.value?.arrow) {
    return {};
  }

  const staticSide = {
    bottom: 'top',
    top: 'bottom',
  }[currentPlacement.value.split('-')[0]] || 'bottom';

  const styles: Record<string, string> = {
    position: 'absolute',
    [staticSide]: '-5px',
  };

  if (middlewareData.value.arrow.x != null) {
    styles.left = `${middlewareData.value.arrow.x}px`;
  }

  if (middlewareData.value.arrow.y != null) {
    styles.top = `${middlewareData.value.arrow.y}px`;
  }

  return styles;
});

const isNotForSale = computed(() => props.seat?.status === 'inactive');

// Modified computed properties for booking statuses
const confirmedBookings = computed(() => props.seat?.bookings?.filter((b: { status: string }) => b.status === 'RAP') ?? []);

const pendingBookings = computed(() => props.seat?.bookings?.filter((b: { status: string }) => b.status === 'RPP') ?? []);

// For displaying badge count and color
const bookingStatus = computed(() => {
  if (confirmedBookings.value.length > 0) {
    return {
      count: confirmedBookings.value.length,
      type: 'confirmed',
    };
  }
  if (pendingBookings.value.length > 0) {
    return {
      count: pendingBookings.value.length,
      type: 'pending',
    };
  }
  return null;
});

// For showing all bookings in popover
const allBookings = computed(() => props.seat?.bookings ?? []);

const statusLabels = {
  RAP: 'Confirmed',
  RCN: 'Cancelled',
  RPP: 'Pending',
};

const shouldRenderPopover = computed(() => open.value);

watch(
  () => props.isOpen,
  (newVal) => {
    open.value = newVal;
  },
);

const handleClick = () => {
  if (!isNotForSale.value) {
    emit('select', props.seat);
  }
  else {
    open.value = !open.value;
  }
};

function handleClickOutside(event: MouseEvent) {
  if (
    !open.value
    || !floating.value
    || !reference.value
    || event.target === reference.value
    || reference.value.contains(event.target as Node)
    || floating.value.contains(event.target as Node)
  ) {
    return;
  }

  open.value = false;
  emit('close');
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    open.value = false;
    emit('close');
  }
}

function handlePopoverClick(event: MouseEvent) {
  event.stopPropagation();
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleEscapeKey);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleEscapeKey);
});
</script>

<template>
  <div
    ref="reference" :class="
      cn(
        'seat relative select-none border text-sm h-full w-full flex items-center justify-center rounded-xl transition-colors duration-200 border-border cursor-pointer hover:border-primary',
        {
          'bg-muted text-muted-foreground': props.seat.status === 'inactive',
          'border-emerald-300 bg-emerald-300/20': bookingStatus?.type === 'confirmed',
          'border-amber-400 bg-amber-400/20': props.seat.status === 'pending',
          '!border-primary text-primary': selected,
        },
      )
    " @click="handleClick"
  >
    <div v-if="bookingStatus" class="absolute right-1 top-1">
      <Badge
        :class="
          cn('ml-auto flex h-4 w-4 shrink-0 p-0 text-[10px] items-center justify-center rounded-full', {
            'bg-emerald-500': bookingStatus.type === 'confirmed',
            'bg-amber-500': bookingStatus.type === 'pending',
          })
        "
      >
        {{ bookingStatus.count }}
      </Badge>
    </div>
    {{ seat.code }}
  </div>

  <div
    v-if="shouldRenderPopover" ref="floating" :style="floatingStyles"
    class="popover-content z-50 w-80 rounded-md border bg-card shadow-lg" @click="handlePopoverClick"
  >
    <div class="mb-3 flex items-center justify-between rounded-t-md bg-primary p-4 text-primary-foreground">
      <h4 class="text-sm font-medium">
        Seat <span class="font-bold tabular-nums">{{ seat.code }}</span>
      </h4>
      <Badge variant="outline" class="text-xs text-primary-foreground">
        {{ seat.type }}
      </Badge>
    </div>

    <!-- Not for sale message -->
    <div class="p-4 pt-0">
      <div v-if="isNotForSale && !seat.bookings?.length" class="py-2 text-sm text-muted-foreground">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:alert-circle" class="size-4" />
          Not for sale
        </div>
        <p class="mt-2 text-xs">
          This could be due to maintenance, reserved status, or other venue restrictions.
        </p>
      </div>
      <!-- Booking information -->
      <div v-else-if="allBookings.length > 0" class="space-y-3">
        <div class="border-b pb-2 last:border-0">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Booking History</span>
            <div class="flex gap-1">
              <Badge
                v-if="confirmedBookings.length"
                class="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 p-0"
              >
                {{ confirmedBookings.length }}
              </Badge>
              <Badge
                v-if="pendingBookings.length"
                class="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 p-0"
              >
                {{ pendingBookings.length }}
              </Badge>
            </div>
          </div>
          <ul class="space-y-2">
            <li v-for="(booking, idx) in allBookings" :key="idx" class="flex items-start gap-2 text-sm">
              <Icon icon="heroicons:chevron-right" class="mt-0.5 size-4 shrink-0" />
              <div class="flex min-w-0 flex-col">
                <span class="truncate">{{ booking.name }}</span>
                <span class="text-xs opacity-75">{{ booking.reg_code }}</span>
              </div>
              <Badge
                variant="outline" :class="
                  cn('ml-auto flex-shrink-0', {
                    'border-emerald-500 text-emerald-500': booking.status === 'RAP',
                    'border-amber-500 text-amber-500': booking.status === 'RPP',
                    'border-muted-foreground text-muted-foreground': booking.status === 'RCN',
                  })
                "
              >
                {{ statusLabels[booking.status] }}
              </Badge>
            </li>
          </ul>
        </div>
      </div>
      <!-- No bookings message -->
      <div v-else class="py-2 text-sm text-muted-foreground">
        No bookings for this seat
      </div>
    </div>

    <div
      ref="arrowRef" :style="arrowStyles" :class="cn(
        'absolute size-2 rotate-45 bg-card',
        currentPlacement.includes('top') ? 'border-b border-r' : 'border-l border-t',
      )"
    >
      {' '}
    </div>
  </div>
</template>

<style>
.popover-content {
  position: fixed;
}
</style>
