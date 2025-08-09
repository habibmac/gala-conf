<!-- components/partials/scanner/LookupResult.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

import type { RegistrationData, ScannerMode } from '~/types';

import AttendeeDetailsCard from '@/components/partials/scanner/AttendeeDetailsCard.vue';
import CheckinHistoryCard from '@/components/partials/scanner/CheckinHistoryCard.vue';
import RegStatusCard from '@/components/partials/scanner/RegStatusCard.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  lookupResult: RegistrationData
  scannerMode: ScannerMode
  isMobile?: boolean
}

interface Emits {
  (e: 'registration-action', registration: RegistrationData, action: 'checkin' | 'checkout', note?: string): void
  (e: 'continue-scanning'): void
  (e: 'close-result'): void
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false,
});

const emit = defineEmits<Emits>();

// Control dialog visibility for mobile
const isDialogOpen = ref(true);

const checkinStatusText = (status: number, timestamp: number | null): string => {
  if (status === 1) {
    return timestamp ? `Checked In on ${formatDate(timestamp, 'dd MMM yyyy HH:mm')}` : 'Checked In';
  }

  if (status === 0) {
    return timestamp ? `Checked Out on ${formatDate(timestamp, 'dd MMM yyyy HH:mm')}` : 'Checked Out';
  }

  return 'Not Checked In';
};

const registrationStatusInfo = computed(() => {
  const reg = props.lookupResult;

  return {
    status: reg.status,
    canCheckin: reg.can_checkin,
    canCheckout: reg.can_checkout,
    checkinStatus: reg.checkin_status,
    checkinStatusText: checkinStatusText(reg.checkin_status, reg.last_checkin_time),
    isCheckedIn: reg.checkin_status === 1,
    lastCheckinTime: reg.last_checkin_time,
  };
});

const paymentStatus = computed(() => {
  const payment = props.lookupResult.payment_validation;

  if (!payment)
    return null;

  return {
    canCheckinPayment: payment.can_checkin_payment,
    isPaymentCompleted: payment.payment_completed,
    isRegistrationApproved: payment.registration_approved,
    paymentMessage: payment.payment_message,
    requiresPayment: payment.requires_payment,
  };
});

const handleAction = (action: 'checkin' | 'checkout') => {
  emit('registration-action', props.lookupResult, action);

  // On mobile, keep dialog open to show updated state
  // On desktop, no change needed
};

const handleContinueScanning = () => {
  emit('continue-scanning');
  if (props.isMobile) {
    isDialogOpen.value = false;
  }
};

const handleClose = () => {
  emit('close-result');
  if (props.isMobile) {
    isDialogOpen.value = false;
  }
};

// Watch for changes in lookupResult to keep dialog open on updates
watch(() => props.lookupResult, () => {
  if (props.isMobile) {
    isDialogOpen.value = true;
  }
}, { deep: true });
</script>

<template>
  <Dialog v-if="isMobile" v-model:open="isDialogOpen">
    <DialogContent class="size-full">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon
            v-if="lookupResult.special_attendee?.is_vip"
            icon="solar:crown-bold"
            class="size-5 text-amber-500"
          />
          <Icon
            v-else
            :icon="registrationStatusInfo.isCheckedIn ? 'heroicons:check-circle' : 'heroicons:user-circle'"
            class="size-5"
            :class="registrationStatusInfo.isCheckedIn ? 'text-green-500' : 'text-blue-500'"
          />
          <span v-if="lookupResult.special_attendee?.is_vip" class="text-amber-600">VIP Registration</span>
          <span v-else>Registration Details</span>
        </DialogTitle>
        <DialogDescription class="flex items-center gap-2">
          <span>{{ lookupResult.code }}</span>
          <Badge
            v-if="lookupResult.special_attendee?.is_vip"
            class="bg-amber-500 text-white"
          >
            <Icon icon="solar:crown-bold" class="mr-1 size-3" />
            VIP
          </Badge>
        </DialogDescription>
      </DialogHeader>

      <!-- Registration Details -->
      <div class="space-y-4 overflow-y-auto">
        <!-- Staff Notes Alert (if present) -->
        <div
          v-if="lookupResult.special_attendee?.notes"
          class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <div class="flex items-start gap-2">
            <Icon icon="solar:note-bold" class="mt-0.5 size-4 text-amber-600" />
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Staff Note
              </h4>
              <p class="text-sm text-amber-700 dark:text-amber-300">
                {{ lookupResult.special_attendee.notes }}
              </p>
            </div>
          </div>
        </div>

        <AttendeeDetailsCard :lookup-result="lookupResult" />
        <RegStatusCard :registration-status-info="registrationStatusInfo" :payment-status="paymentStatus" />
        <CheckinHistoryCard :lookup-result="lookupResult" />
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="handleClose">
          Close
        </Button>

        <Button v-if="registrationStatusInfo.canCheckout" variant="outline" @click="handleAction('checkout')">
          <Icon icon="ph:sign-out" class="mr-2 size-4" />
          Check Out
        </Button>

        <Button v-else-if="registrationStatusInfo.canCheckin" @click="handleAction('checkin')">
          <Icon icon="ph:sign-in" class="mr-2 size-4" />
          Check In
        </Button>

        <Button @click="handleContinueScanning">
          <Icon icon="heroicons:camera" class="mr-2 size-4" />
          Continue Scanning
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Desktop: Show as Card -->
  <Card v-else id="lookup-result-card" class="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon
            v-if="lookupResult.special_attendee?.is_vip"
            icon="solar:crown-bold"
            class="size-5 text-amber-500"
          />
          <Icon
            v-else
            :icon="registrationStatusInfo.isCheckedIn ? 'heroicons:check-circle' : 'heroicons:user-circle'"
            class="size-5"
            :class="registrationStatusInfo.isCheckedIn ? 'text-green-500' : 'text-blue-500'"
          />
          <span v-if="lookupResult.special_attendee?.is_vip" class="text-amber-600">VIP Registration Found</span>
          <span v-else>Registration Found</span>
          <Badge
            v-if="lookupResult.special_attendee?.is_vip"
            class="ml-2 bg-amber-500 text-white"
          >
            <Icon icon="solar:crown-bold" class="mr-1 size-3" />
            VIP
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="hover:bg-blue-100 dark:hover:bg-blue-800"
          @click="handleClose"
        >
          <Icon icon="tabler:x" class="size-4" />
        </Button>
      </CardTitle>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Staff Notes Alert (if present) -->
      <div
        v-if="lookupResult.special_attendee?.notes"
        class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
      >
        <div class="flex items-start gap-3">
          <Icon icon="solar:note-bold" class="mt-0.5 size-5 text-amber-600" />
          <div class="flex-1">
            <h4 class="font-semibold text-amber-800 dark:text-amber-200">
              Staff Note
            </h4>
            <p class="text-amber-700 dark:text-amber-300">
              {{ lookupResult.special_attendee.notes }}
            </p>
          </div>
        </div>
      </div>

      <!-- Attendee Details -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_310px]">
        <div>
          <AttendeeDetailsCard :lookup-result="lookupResult" class="grow" />
        </div>

        <CheckinHistoryCard :lookup-result="lookupResult" />
        <RegStatusCard
          :registration-status-info="registrationStatusInfo"
          :payment-status="paymentStatus"
          class="flex-1"
        />
      </div>
      <div class="">
        <!-- Status and Actions -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap gap-2" />

          <div class="flex gap-2">
            <Button
              v-if="registrationStatusInfo.canCheckout"
              variant="destructive"
              size="lg"
              @click="handleAction('checkout')"
            >
              <Icon icon="ph:sign-out" class="mr-2 size-4" />
              Check Out
            </Button>

            <Button v-else-if="registrationStatusInfo.canCheckin" size="lg" @click="handleAction('checkin')">
              <Icon icon="ph:sign-in" class="mr-2 size-4" />
              Check In
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
