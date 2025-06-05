<script setup lang="ts">
import { computed } from 'vue';

import type { RegistrationData } from '~/types';

const props = defineProps<{
  open: boolean
  registration: RegistrationData | null
}>();

// Define emits
const emit = defineEmits<{
  'update:open': [value: boolean]
  'action': [registration: RegistrationData, action: 'checkin' | 'checkout']
  'continue-scan': []
  'lookup': []
}>();

// Now you can use props.registration safely
const canCheckin = computed(() => {
  return props.registration?.can_checkin && props.registration?.checkin_status !== 1;
});

const canCheckout = computed(() => {
  return props.registration?.can_checkout;
});

const hasPaymentIssues = computed(() => {
  return props.registration?.payment_validation && !props.registration.payment_validation.can_checkin_payment;
});

function handleClose() {
  emit('update:open', false);
}

function handleContinueScan() {
  emit('update:open', false);
  emit('continue-scan');
}

function handleLookupMode() {
  emit('update:open', false);
  emit('lookup');
}

function handleAction(action: 'checkin' | 'checkout') {
  if (props.registration) {
    emit('action', props.registration, action);
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="min-h-screen sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon icon="heroicons:qr-code" class="size-5" />
          Scan Result
        </DialogTitle>
        <DialogDescription> Registration details and available actions </DialogDescription>
      </DialogHeader>

      <div v-if="registration" class="space-y-4">
        <!-- Registration Details -->
        <div class="space-y-3 rounded-lg border p-4">
          <div class="">
            <h4 class="font-semibold">
              {{ registration.attendee.full_name }}
            </h4>
            <Badge
              :variant="canCheckin ? 'default' : 'secondary'" :class="{
                'border-red-200 bg-red-100 text-red-800': hasPaymentIssues,
              }"
            >
              {{ registration.checkin_status_text }}
            </Badge>
          </div>

          <!-- Payment Warning -->
          <div v-if="hasPaymentIssues" class="rounded-lg border border-red-200 bg-red-50 p-3">
            <div class="flex items-center gap-2 text-red-800">
              <Icon icon="heroicons:exclamation-triangle" class="size-4" />
              <span class="text-sm font-medium">Payment Required</span>
            </div>
            <p class="mt-1 text-xs text-red-600">
              {{ registration.payment_validation?.payment_message }}
            </p>
          </div>

          <div class=" flex flex-col space-y-3">
            <div>
              <ClientOnly>
                <Qrcode :value="registration.code" class="mr-4 size-20" />
              </ClientOnly>
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
            <h5 class="mb-2 text-sm font-medium">
              Group Members ({{ registration.group_registrations.length }})
            </h5>
            <div class="max-h-32 space-y-2 overflow-y-auto">
              <div
                v-for="member in registration.group_registrations" :key="member.id"
                class="flex items-center justify-between rounded bg-gray-50 p-2 text-xs"
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
          <Icon icon="heroicons:arrow-path" class="mr-2 size-4" />
          Continue Scanning
        </Button>

        <Button variant="outline" @click="handleLookupMode">
          <Icon icon="heroicons:magnifying-glass" class="mr-2 size-4" />
          Switch to Lookup
        </Button>

        <!-- Action Buttons -->
        <div v-if="registration" class="flex gap-2">
          <Button v-if="canCheckin" size="sm" :disabled="hasPaymentIssues" @click="handleAction('checkin')">
            <Icon icon="heroicons:arrow-right-end-on-rectangle" class="mr-1 size-4" />
            Check In
          </Button>

          <Button v-if="canCheckout" size="sm" variant="destructive" @click="handleAction('checkout')">
            <Icon icon="heroicons:arrow-left-start-on-rectangle" class="mr-1 size-4" />
            Check Out
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
