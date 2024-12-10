<script setup lang="ts">
import {
  Popover,
  PopoverButton, 
  PopoverPanel
} from '@headlessui/vue'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import type { Seat } from '@/types'

const props = defineProps({
  seat: {
    type: Object as PropType<Seat>,
    default: null
  },
  selected: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits<{
  select: [seat: Seat | null]
}>()

const hasBookings = computed(() => {
  return props.seat?.bookings && props.seat.bookings.count > 0
})

const bookingInfo = computed(() => {
  if (!props.seat?.bookings) return null
  
  return {
    count: props.seat.bookings.count,
    attendees: props.seat.bookings.data
  }
})
</script>

<template>
  <Popover v-if="seat">
    <PopoverButton asChild>
      <div 
        :class="[
          'w-full h-full min-w-[32px] min-h-[32px] p-0',
          {
            'bg-primary/10 border-primary': seat.type === 'vip',
            'border-border': seat.type === 'premium',
            'bg-muted': hasBookings,
            'bg-primary text-white': selected
          }
        ]"
        @click="emit('select', seat)"
      >
        {{ seat.code }}
      </div>
    </PopoverButton>
    
    <PopoverPanel v-if="hasBookings && bookingInfo" class="w-80 p-0">
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium">Seat {{ seat.code }}</h4>
          <Badge variant="outline">
            {{ seat.type.toUpperCase() }}
          </Badge>
        </div>
        
        <div class="space-y-3">
          <div class="border-b last:border-0 pb-2">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium">Bookings</span>
              <Badge>
                {{ bookingInfo.count }} {{ bookingInfo.count === 1 ? 'booking' : 'bookings' }}
              </Badge>
            </div>
            
            <ul class="space-y-1">
              <li 
                v-for="(attendee, idx) in bookingInfo.attendees" 
                :key="idx"
                class="text-sm text-muted-foreground flex items-center gap-2"
              >
                {{ attendee.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PopoverPanel>
  </Popover>
</template>