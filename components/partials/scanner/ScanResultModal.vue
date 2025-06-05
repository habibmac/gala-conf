<script setup lang="ts">
import { computed } from 'vue'
import type { RegistrationData } from '~/types'

// Define props properly
interface Props {
  open: boolean
  registration: RegistrationData | null
}

const props = defineProps<Props>()

// Define emits
const emit = defineEmits<{
  'update:open': [value: boolean]
  action: [registration: RegistrationData, action: 'checkin' | 'checkout']
  'continue-scan': []
  lookup: []
}>()

// Now you can use props.registration safely
const canCheckin = computed(() => {
  return props.registration?.can_checkin && props.registration?.checkin_status !== 1
})

const canCheckout = computed(() => {
  return props.registration?.can_checkout
})

const hasPaymentIssues = computed(() => {
  return props.registration?.payment_validation && 
         !props.registration.payment_validation.can_checkin_payment
})

const handleClose = () => {
  emit('update:open', false)
}

const handleContinueScan = () => {
  emit('update:open', false)
  emit('continue-scan')
}

const handleLookupMode = () => {
  emit('update:open', false)
  emit('lookup')
}

const handleAction = (action: 'checkin' | 'checkout') => {
  if (props.registration) {
    emit('action', props.registration, action)
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md min-h-screen">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon icon="heroicons:qr-code" class="w-5 h-5" />
          Scan Result
        </DialogTitle>
        <DialogDescription>
          Registration details and available actions
        </DialogDescription>
      </DialogHeader>

      <div v-if="registration" class="space-y-4">
        <!-- Registration Details -->
        <div class="border rounded-lg p-4 space-y-3">
          <div class="">
            <h4 class="font-semibold">{{ registration.attendee.full_name }}</h4>
            <Badge 
              :variant="canCheckin ? 'default' : 'secondary'"
              :class="{
                'bg-red-100 text-red-800 border-red-200': hasPaymentIssues,
              }"
            >
              {{ registration.checkin_status_text }}
            </Badge>
          </div>

          <!-- Payment Warning -->
          <div 
            v-if="hasPaymentIssues" 
            class="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div class="flex items-center gap-2 text-red-800">
              <Icon icon="heroicons:exclamation-triangle" class="w-4 h-4" />
              <span class="text-sm font-medium">Payment Required</span>
            </div>
            <p class="text-xs text-red-600 mt-1">
              {{ registration.payment_validation?.payment_message }}
            </p>
          </div>

          <div class="flex flex-col space-y-3">
            <div>
              <Qrcode :value="registration.code" class="w-20 h-20 mr-4" />
            </div>
            <div class="grid grid-cols-1 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Code:</span>
                <span class="ml-2 font-semibold">{{ registration.code }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Ticket:</span>
                <span class="ml-2 font-medium">{{ registration.ticket.name }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Email:</span>
                <span class="ml-2">{{ registration.attendee.email }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Phone:</span>
                <span class="ml-2">{{ registration.attendee.phone }}</span>
              </div>
            </div>
          </div>

          <!-- Group Registrations -->
          <div v-if="registration.group_registrations?.length" class="mt-4">
            <h5 class="text-sm font-medium mb-2">Group Members ({{ registration.group_registrations.length }})</h5>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <div 
                v-for="member in registration.group_registrations" 
                :key="member.id"
                class="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
              >
                <span>{{ member.attendee_name }}</span>
                <Badge variant="outline" size="sm">
                  {{ member.checkin_status_text }}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="handleContinueScan">
          <Icon icon="heroicons:arrow-path" class="w-4 h-4 mr-2" />
          Continue Scanning
        </Button>
        
        <Button variant="outline" @click="handleLookupMode">
          <Icon icon="heroicons:magnifying-glass" class="w-4 h-4 mr-2" />
          Switch to Lookup
        </Button>

        <!-- Action Buttons -->
        <div v-if="registration" class="flex gap-2">
          <Button
            v-if="canCheckin"
            size="sm"
            @click="handleAction('checkin')"
            :disabled="hasPaymentIssues"
          >
            <Icon icon="heroicons:arrow-right-end-on-rectangle" class="w-4 h-4 mr-1" />
            Check In
          </Button>
          
          <Button
            v-if="canCheckout"
            size="sm"
            variant="destructive"
            @click="handleAction('checkout')"
          >
            <Icon icon="heroicons:arrow-left-start-on-rectangle" class="w-4 h-4 mr-1" />
            Check Out
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>