<!-- components/partials/scanner/LookupResult.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

import type { RegistrationData, ScannerMode } from '~/types';

import AttendeeDetailsCard from '@/components/partials/scanner/AttendeeDetailsCard.vue';
import CheckinHistoryCard from '@/components/partials/scanner/CheckinHistoryCard.vue';
import CustomQuestionsCard from '@/components/partials/scanner/CustomQuestionsCard.vue';
import RegStatusCard from '@/components/partials/scanner/RegStatusCard.vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  lookupResult: RegistrationData
  scannerMode: ScannerMode
  isMobile?: boolean
  visible?: boolean
}

interface Emits {
  (e: 'registration-action', registration: RegistrationData, action: 'checkin' | 'checkout', note?: string): void
  (e: 'continue-scanning'): void
  (e: 'close-result'): void
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false,
  visible: true,
});

const emit = defineEmits<Emits>();

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

const showActionDialog = ref(false);
const actionType = ref<'checkin' | 'checkout'>('checkin');
const noteText = ref('');

const handleAction = (action: 'checkin' | 'checkout') => {
  actionType.value = action;
  noteText.value = '';
  showActionDialog.value = true;
};

const submitAction = () => {
  emit('registration-action', props.lookupResult, actionType.value, noteText.value || undefined);
  showActionDialog.value = false;
  noteText.value = '';
};

const cancelAction = () => {
  showActionDialog.value = false;
  noteText.value = '';
};

const handleContinueScanning = () => {
  emit('continue-scanning');
};

const handleClose = () => {
  emit('close-result');
};
</script>

<template>
  <Dialog :open="visible" @update:open="(open) => !open && handleClose()">
    <DialogContent class="flex size-full max-w-none flex-col">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon v-if="lookupResult.special_attendee?.is_vip" icon="solar:crown-bold" class="size-5 text-amber-500" />
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
          <Badge v-if="lookupResult.special_attendee?.is_vip" class="bg-amber-500 text-white">
            <Icon icon="solar:crown-bold" class="mr-1 size-3" />
            VIP
          </Badge>
        </DialogDescription>
      </DialogHeader>

      <!-- Registration Details -->
      <div :class="isMobile ? 'flex flex-1 flex-col gap-4 overflow-y-auto' : 'flex flex-1 gap-4 overflow-y-auto'">
        <!-- Left Column -->
        <div class="flex flex-1 flex-col gap-4">
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

          <RegStatusCard
            v-if="!isMobile"
            :registration-status-info="registrationStatusInfo"
            :payment-status="paymentStatus"
          />

          <!-- Mobile: Include all cards in single column -->
          <template v-if="isMobile">
            <CustomQuestionsCard :lookup-result="lookupResult" />
            <RegStatusCard :registration-status-info="registrationStatusInfo" :payment-status="paymentStatus" />
            <CheckinHistoryCard :lookup-result="lookupResult" />
          </template>
        </div>

        <!-- Desktop: Right Column -->

        <div v-if="!isMobile" class="flex flex-1 flex-col gap-4">
          <CustomQuestionsCard :lookup-result="lookupResult" />
          <CheckinHistoryCard :lookup-result="lookupResult" />
        </div>
      </div>

      <DialogFooter class="mt-auto gap-2">
        <Button variant="outline" @click="handleClose">
          Close
        </Button>

        <Button
          v-if="registrationStatusInfo.canCheckout"
          class="border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-200"
          @click="handleAction('checkout')"
        >
          <Icon icon="ph:sign-out" class="mr-2 size-4" />
          Check Out
        </Button>

        <Button
          v-else-if="registrationStatusInfo.canCheckin"
          class="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          @click="handleAction('checkin')"
        >
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

  <!-- Checkin/Checkout with Note Dialog -->
  <Dialog v-model:open="showActionDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon 
            :icon="actionType === 'checkin' ? 'ph:sign-in' : 'ph:sign-out'" 
            class="size-5"
            :class="actionType === 'checkin' ? 'text-emerald-600' : 'text-rose-600'"
          />
          {{ actionType === 'checkin' ? 'Check In' : 'Check Out' }}
        </DialogTitle>
        <DialogDescription>
          {{ actionType === 'checkin' ? 'Check in' : 'Check out' }} {{ lookupResult.attendee.fullname }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="note">Note (Optional)</Label>
          <Textarea
            id="note"
            v-model="noteText"
            placeholder="Add an optional note for this action..."
            class="min-h-20"
            @keydown.ctrl.enter="submitAction"
          />
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="cancelAction">
          Cancel
        </Button>
        <Button @click="submitAction">
          <Icon 
            :icon="actionType === 'checkin' ? 'ph:sign-in' : 'ph:sign-out'" 
            class="mr-2 size-4" 
          />
          {{ actionType === 'checkin' ? 'Check In' : 'Check Out' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
