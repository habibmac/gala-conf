<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { breakpointsTailwind, useBreakpoints, useDebounceFn, useSwipe } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';

import type { ApiError, RegistrationData, ScanHistoryItem, ScannerMode, ScannerSettings, SupportedBarcodeFormat } from '~/types';

import LookupResult from '@/components/partials/scanner/LookupResult.vue';
import ScanHistory from '@/components/partials/scanner/ScanHistory.vue';
import ScannerDatetimes from '@/components/partials/scanner/ScannerDatetimes.vue';
import ScannerInput from '@/components/partials/scanner/ScannerInput.vue';
import ScannerInstructions from '@/components/partials/scanner/ScannerInstructions.vue';
import ScannerStats from '@/components/partials/scanner/ScannerStats.vue';
import SearchResults from '@/components/partials/scanner/SearchResults.vue';
import TicketScanner from '@/components/partials/scanner/TicketScanner.vue';
import { Badge } from '@/components/ui/badge';
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

type CapabilityKey = keyof ScannerSettings['capabilities'];

definePageMeta({
  capabilities: ['ee_read_checkins'],
  group: 'tools',
  icon: 'solar:qr-code-bold-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Ticket Scanner',
});

const route = useRoute();
const { $galantisApi } = useNuxtApp();

// Get datetime id from route params
const selectedDatetime = ref('');

const isLoading = ref(true);
const scannerSettings = ref<ScannerSettings | null>(null);
const isScannerOpen = ref(false);
const scanHistory = ref<ScanHistoryItem[]>([]);
const unifiedInput = ref('');
const isProcessing = ref(false);
const scannerMode = ref<ScannerMode>('lookup');
const isSearching = ref(false);
const supportedFormats = ref<string[]>([]);

const currentScanResult = ref<RegistrationData>();

// Search functionality
const searchResults = ref<RegistrationData[]>([]);

// Lookup result
const lookupResult = ref<RegistrationData | null>(null);
const showLookupModal = ref(false);

const eventId = computed(() => route.params.eventId as string);
const canScan = computed(() => !!selectedDatetime.value && !!scannerSettings.value);
const recentScans = computed(() => scanHistory.value.slice(0, 10));
const successfulScans = computed(() => scanHistory.value.filter(scan => scan.status === 'success').length);
const failedScans = computed(() => scanHistory.value.filter(scan => scan.status === 'error').length);

const showClearConfirmDialog = ref(false);
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => !breakpoints.md.value);

// Guide/Instructions visibility
const showInstructions = ref(false);

// Scanner focus lock mode
const scannerFocusLocked = ref(false);

// Scanner ref
const TicketScannerRef = ref<InstanceType<typeof TicketScanner> | null>(null);

const isOpen = ref(false);
const contentRef = ref<HTMLElement | null>(null);
const { isSwiping, direction } = useSwipe(contentRef);

watch(isSwiping, () => {
  if (direction.value === 'right') {
    // Close scanner on swipe
    isOpen.value = false;
  }
});

// Scanner mode configuration
const modeConfig = computed(() => ({
  lookup: {
    capability: 'lookup' as CapabilityKey,
    color: 'blue',
    description: 'Scan or enter code to view registration details',
    icon: 'heroicons:qr-code',
    title: 'Lookup Mode',
  },
  continuous: {
    capability: 'continuous_scan' as CapabilityKey,
    color: 'orange',
    description: 'Automatic check-in mode for high volume',
    icon: 'heroicons:bolt',
    title: 'Continuous Check-in',
  },
  search: {
    capability: 'search' as CapabilityKey,
    color: 'green',
    description: 'Search registrations by name, email, or code',
    icon: 'heroicons:magnifying-glass',
    title: 'Search Mode',
  },
}));

// Available scanner modes for the dropdown
const availableModes = computed(() => {
  if (!scannerSettings.value?.capabilities)
    return [];

  return Object.entries(modeConfig.value)
    .filter(([_key, config]) => {
      // Use the capability mapping from modeConfig
      const requiredCapability = config.capability;
      return scannerSettings.value?.capabilities?.[requiredCapability] ?? false;
    })
    .map(([key, config]) => ({
      color: config.color,
      description: config.description,
      icon: config.icon,
      label: config.title,
      value: key,
    }));
});

const loadScannerSettings = async () => {
  try {
    isLoading.value = true;
    const response = await $galantisApi.get(`/event/${eventId.value}/scanner`);

    let scannerData = null;

    if (response.data && response.data.success && response.data.data) {
      scannerData = response.data.data;
    }
    else if (response.data && response.data.event) {
      scannerData = response.data;
    }

    if (scannerData && scannerData.event) {
      scannerSettings.value = scannerData;

      if (scannerSettings.value?.datetimes) {
        // Set supported formats
        supportedFormats.value = scannerSettings.value.supported_formats || [];
      }
    }
    else {
      throw new Error('Invalid response format from scanner API');
    }
  }
  catch (error: unknown) {
    console.error('Failed to load scanner settings:', error);
    const apiError = error as ApiError;

    console.error('Error details:', {
      message: apiError.message,
      response: apiError.response?.data,
      status: apiError.response?.status,
      statusText: apiError.response?.statusText,
    });

    let errorMessage = 'Failed to load scanner settings';

    if (apiError.response && apiError.response.status) {
      if (apiError.response.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      }
      else if (apiError.response.status === 403) {
        errorMessage = 'You do not have permission to access the scanner.';
      }
      else if (apiError.response.status === 404) {
        errorMessage = 'Scanner endpoint not found. Please check if the event exists.';
      }
      else if (apiError.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    }
    else if (apiError.message) {
      errorMessage = apiError.message;
    }

    toast.error(
      'Scanner Error',
      {
        description: errorMessage,
      },
    );
  }
  finally {
    isLoading.value = false;
  }
};

const performLookup = async (code: string) => {
  if (!selectedDatetime.value)
    return;

  try {
    const response = await $galantisApi.post(`/event/${eventId.value}/scanner/lookup`, {
      barcode: code,
      datetime_id: selectedDatetime.value,
    });

    if (response.data.success) {
      const registrationData = response.data.data as RegistrationData;
      lookupResult.value = registrationData;
      showLookupModal.value = true;

      const scanEntry: ScanHistoryItem = {
        attendeeName: registrationData?.attendee?.fullname,
        code,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Registration found',
        registrationData,
        status: 'lookup',
        timestamp: Date.now(),
      };

      scanHistory.value.unshift(scanEntry);
    }
    else {
      throw new Error(response.data.message || 'Registration not found');
    }
  }
  catch (error: unknown) {
    const apiError = error as ApiError;
    handleScanError(
      { format: 'manual', rawValue: code, timestamp: Date.now() },
      apiError.response?.data?.message || 'Lookup failed',
    );
  }
};

const performCheckin = async (code: string, action = 'checkin') => {
  if (!selectedDatetime.value)
    return;

  try {
    const response = await $galantisApi.post(`/event/${eventId.value}/scanner/checkin`, {
      action,
      barcode: code,
      check_approved: true,
      datetime_id: selectedDatetime.value,
    });

    if (response.data.success) {
      const registrationData = response.data.data as RegistrationData;

      const scanEntry: ScanHistoryItem = {
        action: response.data.action_taken,
        attendeeName: registrationData?.attendee?.fullname,
        code,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: `${action} successful`,
        registrationData,
        status: 'success',
        timestamp: Date.now(),
      };

      scanHistory.value.unshift(scanEntry);

      toast.success(
        `${action} Successful ✅`,
        {
          description: `${registrationData?.attendee?.fullname || 'Attendee'} ${action} completed`,
        },
      );

      return response.data;
    }
    else {
      throw new Error(response.data.message || `${action} failed`);
    }
  }
  catch (error: unknown) {
    const apiError = error as ApiError;
    handleScanError(
      { format: 'manual', rawValue: code, timestamp: Date.now() },
      apiError.response?.data?.message || `${action} failed`,
    );
  }
};

const handleUnifiedAction = async () => {
  if (!unifiedInput.value.trim() || !selectedDatetime.value)
    return;

  isProcessing.value = true;

  try {
    switch (scannerMode.value) {
      case 'search':
        await performSearch();
        break;
      case 'lookup':
        await performLookup(unifiedInput.value.trim());
        unifiedInput.value = ''; // Clear after lookup
        break;
      case 'continuous':
        await performCheckin(unifiedInput.value.trim(), 'checkin');
        unifiedInput.value = ''; // Clear after checkin
        break;
    }
  }
  finally {
    isProcessing.value = false;
  }
};

const debouncedSearch = useDebounceFn(async (searchTerm: string) => {
  if (!searchTerm.trim() || !selectedDatetime.value) {
    searchResults.value = [];
    return;
  }

  if (searchTerm.length < 2) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;

  try {
    const response = await $galantisApi.post(`/event/${eventId.value}/scanner/search`, {
      datetime_id: selectedDatetime.value,
      search: searchTerm,
      limit: 20,
    });

    if (response.data.success) {
      searchResults.value = response.data.data;
    }
    else {
      searchResults.value = [];
    }
  }
  catch (error: unknown) {
    searchResults.value = [];
    console.error('Search failed:', error);
  }
  finally {
    isSearching.value = false;
  }
}, 300); // 300ms debounce delay

const performSearch = async () => {
  debouncedSearch(unifiedInput.value);
};

const handleScanResult = async (result: { rawValue: string, format: string, timestamp: number }) => {
  if (isProcessing.value || !selectedDatetime.value)
    return;

  isProcessing.value = true;

  try {
    // Always do lookup first to get registration data
    const response = await $galantisApi.post(`/event/${eventId.value}/scanner/lookup`, {
      barcode: result.rawValue,
      datetime_id: selectedDatetime.value,
    });

    if (response.data.success) {
      currentScanResult.value = response.data.data;

      // Add to scan history
      const scanEntry: ScanHistoryItem = {
        attendeeName: currentScanResult.value?.attendee?.fullname,
        code: result.rawValue,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Registration found',
        registrationData: currentScanResult.value,
        status: 'lookup',
        timestamp: Date.now(),
      };
      scanHistory.value.unshift(scanEntry);

      lookupResult.value = currentScanResult.value || null;
      if (currentScanResult.value) {
        showLookupModal.value = true;
      }

      // Determine what action is possible
      const canCheckin = currentScanResult.value?.can_checkin;
      const canCheckout = currentScanResult.value?.can_checkout;

      if (canCheckin || canCheckout) {
        // Play success beep for valid registrations
        TicketScannerRef.value?.playSuccessBeep();

        // Handle continuous mode - auto-perform the available action
        if (scannerMode.value === 'continuous') {
          if (canCheckin) {
            await handleRegistrationAction(response.data.data, 'checkin');
          }
          else if (canCheckout) {
            await handleRegistrationAction(response.data.data, 'checkout');
          }
          // Continue scanning after successful action
          if (TicketScannerRef.value) {
            TicketScannerRef.value.resumeScanning();
          }
        }
      }
      else {
        // No valid actions available
        TicketScannerRef.value?.playErrorBeep();

        handleScanError(
          { format: result.format, rawValue: result.rawValue, timestamp: result.timestamp },
          'Registration cannot be checked in or out',
        );

        // In continuous mode, pause scanning to show the error
        if (scannerMode.value === 'continuous') {
          // Scanner will pause automatically, user can manually resume
        }
      }
    }
    else {
      throw new Error(response.data.message || 'Registration not found');
    }
  }
  catch (error: unknown) {
    const apiError = error as ApiError;

    // Play error beep when lookup fails
    TicketScannerRef.value?.playErrorBeep();

    handleScanError(
      { format: result.format, rawValue: result.rawValue, timestamp: result.timestamp },
      apiError.response?.data?.message || 'Lookup failed',
    );

    // In continuous mode, pause scanning on errors
    if (scannerMode.value === 'continuous') {
      // Scanner will pause, allowing user to see the error and manually resume
    }
  }
  finally {
    isProcessing.value = false;
  }
};

const handleScanError = (result: { rawValue: string, format: string, timestamp: number }, message: string) => {
  const scanEntry: ScanHistoryItem = {
    code: result.rawValue,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message,
    status: 'error',
    timestamp: result.timestamp,
  };

  scanHistory.value.unshift(scanEntry);

  // Show different toast styles for payment errors
  const isPaymentError = message.includes('Payment') || message.includes('payment');

  toast.error(
    isPaymentError ? 'Payment Required ⚠️' : 'Scan Error ⚠️',
    {
      description: message,
    },
  );
};

const handleScannerError = (error: string) => {
  // Play error beep for camera/scanner errors
  TicketScannerRef.value?.playErrorBeep();

  toast.error(
    'Scanner Error',
    {
      description: error,

    },
  );
};

const resumeScanning = () => {
  if (TicketScannerRef.value) {
    TicketScannerRef.value.resumeScanning();
  }
  // Open scanner if it's not already open
  if (!isScannerOpen.value) {
    isScannerOpen.value = true;
  }
};

const clearLookupResult = () => {
  lookupResult.value = null;
  showLookupModal.value = false;
};

const handleScannerCheckin = async (data: { registration: any, note: string }) => {
  if (!data.registration) {
    toast.error(
      'Check-in Error',
      {
        description: 'Registration data is missing',
      },
    );
    return;
  }
  await handleRegistrationAction(data.registration, 'checkin', data.note);
};

const handleScannerCheckout = async (data: { registration: any, note: string }) => {
  if (!data.registration) {
    toast.error(
      'Check-out Error',
      {
        description: 'Registration data is missing',
      },
    );
    return;
  }
  await handleRegistrationAction(data.registration, 'checkout', data.note);
};

const handleSaveNoteOnly = (data: { registration: any, note: string }) => {
  if (!data.registration) {
    toast.error(
      'Save Note Error',
      {
        description: 'Registration data is missing',
      },
    );
  }
  // Implementation for saving note without action would go here
};

const toggleScanner = () => {
  if (!canScan.value) {
    toast.error(
      'Cannot Start Scanner',
      {
        description: 'Please select a datetime session first',
      },
    );
    return;
  }

  // Clear lookup result when closing scanner on mobile
  if (isScannerOpen.value && isMobile.value) {
    lookupResult.value = null;
  }

  isScannerOpen.value = !isScannerOpen.value;
};

const confirmClearHistory = () => {
  if (scanHistory.value.length === 0) {
    toast.error(
      'Nothing to Clear',
      {
        description: 'Scan history is already empty',
      },
    );
    return;
  }

  showClearConfirmDialog.value = true;
};

const clearHistory = () => {
  scanHistory.value = [];
  showClearConfirmDialog.value = false;
  toast.success(
    'History Cleared',
    {
      description: 'Scan history has been cleared',
    },
  );
};

const exportHistory = () => {
  if (scanHistory.value.length === 0)
    return;

  const data = scanHistory.value.map(scan => ({
    action: scan.action || '',
    attendee: scan.attendeeName || '',
    code: scan.code,
    message: scan.message || '',
    status: scan.status,
    timestamp: formatTimestamp(scan.timestamp),
  }));

  const csv = [
    'Timestamp,Code,Status,Message,Attendee,Action',
    ...data.map(row =>
      Object.values(row)
        .map(val => `"${val}"`)
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scanner-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const handleRegistrationAction = async (
  registration: RegistrationData,
  action: 'checkin' | 'checkout',
  note?: string,
) => {
  try {
    const response = await $galantisApi.post(`/event/${eventId.value}/scanner/checkin`, {
      action,
      barcode: registration.code,
      check_approved: true,
      datetime_id: selectedDatetime.value,
      note: note || undefined,
    });

    if (response.data.success) {
      const updatedRegistration = response.data.data as RegistrationData;

      // Update the lookup result if this is the same registration
      if (lookupResult.value?.id === registration.id) {
        lookupResult.value = updatedRegistration;
      }

      // Update current scan result if this is the same registration
      if (currentScanResult.value?.id === registration.id) {
        currentScanResult.value = updatedRegistration;
      }

      // Update search results if this registration is in the list
      const index = searchResults.value.findIndex(r => r.id === registration.id);

      if (index !== -1) {
        searchResults.value[index] = updatedRegistration;
      }

      const scanEntry: ScanHistoryItem = {
        action: response.data.action_taken,
        attendeeName: updatedRegistration?.attendee?.fullname,
        code: registration.code,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: `${action} successful${note ? ' (with note)' : ''}`,
        registrationData: updatedRegistration,
        status: 'success',
        timestamp: Date.now(),
        note,
      };

      scanHistory.value.unshift(scanEntry);

      // Enhanced toast for VIP attendees
      const isVip = updatedRegistration?.special_attendee?.is_vip;
      const vipPrefix = isVip ? '👑 VIP ' : '';
      const vipSuffix = isVip ? ' 👑' : '';

      toast.success(`${vipPrefix}${action} Successful${vipSuffix} ✅`, {
        description: `${updatedRegistration?.attendee?.fullname || 'Attendee'} ${action} completed${note ? ' (with note)' : ''}${updatedRegistration?.special_attendee?.notes ? ` - ${updatedRegistration.special_attendee.notes}` : ''}`,
        duration: isVip ? 6000 : 3000, // Longer duration for VIPs
      });

      // Resume scanning after action (longer delay for VIPs)
      const resumeDelay = isVip ? 2000 : 1000; // 2s for VIP, 1s for regular
      setTimeout(() => {
        if (TicketScannerRef.value) {
          TicketScannerRef.value.resumeScanning();
        }
      }, resumeDelay);

      return response.data;
    }
  }
  catch (error: unknown) {
    const apiError = error as ApiError;
    TicketScannerRef.value?.playErrorBeep();
    handleScanError(
      { format: 'manual', rawValue: registration.code, timestamp: Date.now() },
      apiError.response?.data?.message || `${action} failed`,
    );
  }
};

const codeFormat = computed((): SupportedBarcodeFormat[] => {
  // Default Event Espresso formats
  return ['qr_code', 'code_128', 'code_39', 'ean_13'];
});

// Watch for changes in unified input when in search mode
watch(
  () => unifiedInput.value,
  (newValue) => {
    if (scannerMode.value === 'search') {
      debouncedSearch(newValue);
      // Clear lookup result when search input changes
      lookupResult.value = null;
    }
  },
);

// Watch for scanner mode changes
watch(
  () => scannerMode.value,
  (newMode) => {
    if (newMode === 'search') {
      // Trigger search if there's already text in input
      if (unifiedInput.value.trim()) {
        debouncedSearch(unifiedInput.value);
      }
    }
    else {
      // Clear search results when not in search mode
      searchResults.value = [];
    }

    // Clear lookup result when changing modes
    lookupResult.value = null;
  },
);

// Clear search results when datetime changes
watch(
  () => selectedDatetime.value,
  () => {
    if (scannerMode.value === 'search' && unifiedInput.value.trim()) {
      debouncedSearch(unifiedInput.value);
    }
  },
);

// Watch for camera sheet closure and reset lookup result
watch(() => isScannerOpen.value, (isOpen) => {
  if (!isOpen && isMobile.value) {
    // Clear lookup result when camera closes on mobile
    setTimeout(() => {
      lookupResult.value = null;
    }, 300); // Small delay to allow sheet to close smoothly
  }
});

onMounted(() => {
  loadScannerSettings();

  // Focus lock management for barcode scanners
  const handleGlobalClick = (event: Event) => {
    if (scannerFocusLocked.value) {
      // Find the scanner input and focus it
      const scannerInput = document.querySelector('input[data-scanner-input="true"]') as HTMLInputElement;
      if (scannerInput && scannerInput !== event.target) {
        event.preventDefault();
        scannerInput.focus();
      }
    }
  };

  const handleGlobalKeydown = (event: KeyboardEvent) => {
    if (scannerFocusLocked.value) {
      // Find the scanner input and focus it unless we're in a specific input
      const target = event.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (!isInInput || target.getAttribute('data-scanner-input') !== 'true') {
        const scannerInput = document.querySelector('input[data-scanner-input="true"]') as HTMLInputElement;
        if (scannerInput) {
          scannerInput.focus();
        }
      }
    }
  };

  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('keydown', handleGlobalKeydown);

  // Add beforeunload listener
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (scanHistory.value.length > 0) {
      event.preventDefault();
      event.returnValue = 'You have scan history that will be lost. Are you sure you want to leave?';
      return event.returnValue;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Clean up the event listeners
  onUnmounted(() => {
    document.removeEventListener('click', handleGlobalClick);
    document.removeEventListener('keydown', handleGlobalKeydown);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });
});

onUnmounted(() => {
  isScannerOpen.value = false;
});

// Add navigation guard to warn about unsaved scan history
onBeforeRouteLeave((_to, _from) => {
  if (scanHistory.value.length > 0) {
    const answer = window.confirm(
      `You have ${scanHistory.value.length} scan history entries. Are you sure you want to leave this page? Your scan history will be lost.`,
    );

    if (!answer) {
      return false; // Cancel the navigation
    }
  }
  return true; // Allow navigation
});

useHead({
  meta: [
    {
      content: 'Advanced scanner for managing event registrations and check-ins.',
      name: 'description',
    },
  ],
  title: 'Ticket Scanner',
});
</script>

<template>
  <div class="container mx-auto mb-20">
    <div class="flex flex-col gap-5 pt-10 sm:flex-row sm:items-start sm:justify-between">
      <header class="flex grow items-center gap-2">
        <h1 class="h2">
          Ticket Scanner
        </h1>
        <Button variant="outline" @click="showInstructions = !showInstructions">
          <Icon icon="heroicons:question-mark-circle" class="mr-2 size-4" />
          {{ showInstructions ? 'Hide Guide' : 'Show Guide' }}
        </Button>
      </header>
      <div v-if="scannerSettings" class=" min-w-80 shrink-0">
        <ScannerDatetimes v-model:selected-datetime="selectedDatetime" :datetimes="scannerSettings.datetimes" />
      </div>
    </div>

    <!-- Scanner Instructions -->
    <ScannerInstructions
      :available-modes="availableModes"
      :supported-formats="supportedFormats"
      :visible="showInstructions"
      custom-class="mt-8"
      @close="showInstructions = false"
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="mt-8">
      <div class="grid grid-cols-12 gap-4">
        <Skeleton v-for="i in 3" :key="i" class="col-span-12 h-32 rounded-xl  bg-muted-foreground/10 md:col-span-4" />
      </div>
    </div>

    <div v-else-if="scannerSettings" class="space-y-4">
      <!-- Session Selection & Guide Button -->
      <div class="flex items-center justify-between gap-4" />
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="selectedDatetime" class="space-y-4">
          <!-- Scanner Stats -->
          <ScannerStats
            v-if="selectedDatetime"
            :selected-datetime="selectedDatetime"
            :successful-scans="successfulScans"
            :failed-scans="failedScans"
          />

          <!-- Scanner Input -->
          <ScannerInput
            v-model:selected-datetime="selectedDatetime"
            v-model:scanner-mode="scannerMode"
            v-model:unified-input="unifiedInput"
            v-model:is-scanner-open="isScannerOpen"
            v-model:scanner-focus-locked="scannerFocusLocked"
            :scanner-settings="scannerSettings"
            :is-processing="isProcessing"
            :is-searching="isSearching"
            :can-scan="canScan"
            :available-modes="availableModes"
            :mode-config="modeConfig"
            @unified-action="handleUnifiedAction"
            @toggle-scanner="toggleScanner"
          />

          <!-- Mobile Layout (Sheet) -->
          <Sheet v-if="isMobile && isScannerOpen" v-model:open="isScannerOpen">
            <SheetContent side="bottom" class="">
              <SheetHeader>
                <SheetTitle>
                  <div class="flex items-center gap-2">
                    <Icon
                      :icon="modeConfig[scannerMode].icon"
                      class="size-5"
                      :style="{ color: modeConfig[scannerMode].color }"
                    />
                    {{ modeConfig[scannerMode].title }}
                  </div>
                </SheetTitle>
                <SheetDescription>Point the camera at a barcode or QR code</SheetDescription>
              </SheetHeader>
              <div class="flex h-[60vh] w-full items-center justify-center overflow-y-auto">
                <TicketScanner
                  ref="TicketScannerRef"
                  :formats="codeFormat"
                  :auto-resume="scannerMode === 'continuous'"
                  @detect="handleScanResult"
                  @error="handleScannerError"
                  @checkin="handleScannerCheckin"
                  @checkout="handleScannerCheckout"
                  @save-note="handleSaveNoteOnly"
                />
              </div>
              <SheetFooter>
                <Button variant="outline" class="w-full" @click="toggleScanner">
                  Close Camera
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <!-- Desktop Layout (Grid) -->
          <div v-if="!isMobile && (isScannerOpen || scannerMode === 'search')" class="grid grid-cols-12 gap-4">
            <!-- Scanner Column -->
            <div v-if="isScannerOpen" class="order-last col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Camera Scanner</CardTitle>
                </CardHeader>
                <CardContent>
                  <TicketScanner
                    ref="TicketScannerRef"
                    :formats="codeFormat"
                    :auto-resume="scannerMode === 'continuous'"
                    @detect="handleScanResult"
                    @error="handleScannerError"
                    @checkin="handleScannerCheckin"
                    @checkout="handleScannerCheckout"
                    @save-note="handleSaveNoteOnly"
                  />
                  <div class="mt-4 space-y-2">
                    <Button
                      v-if="!TicketScannerRef?.isScanning && !isProcessing"
                      class="w-full"
                      @click="resumeScanning"
                    >
                      Continue Scanning
                    </Button>
                    <Button variant="outline" class="w-full" @click="toggleScanner">
                      Close Camera
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Search Results Column (Desktop) -->
            <div
              v-if="scannerMode === 'search'"
              class="space-y-4"
              :class="{
                'col-span-8': isScannerOpen, 'col-span-12': !isScannerOpen,
              }"
            >
              <!-- Search Results (Desktop) -->
              <SearchResults
                :search-results="searchResults"
                :unified-input="unifiedInput"
                :is-processing="isProcessing"
                :is-searching="isSearching"
                @select-result="lookupResult = $event; showLookupModal = true"
              />
            </div>
          </div>

          <!-- Desktop Lookup Result Modal -->
          <LookupResult
            v-if="lookupResult && !isMobile"
            :lookup-result="lookupResult"
            :scanner-mode="scannerMode"
            :is-mobile="false"
            :visible="showLookupModal"
            @registration-action="handleRegistrationAction"
            @continue-scanning="resumeScanning"
            @close-result="clearLookupResult"
          />

          <!-- Mobile Results (Outside Scanner Sheet) -->
          <template v-if="isMobile">
            <!-- Lookup Result (Mobile) -->
            <LookupResult
              v-if="lookupResult"
              :lookup-result="lookupResult"
              :scanner-mode="scannerMode"
              :is-mobile="true"
              :visible="showLookupModal"
              @registration-action="handleRegistrationAction"
              @continue-scanning="resumeScanning"
              @close-result="clearLookupResult"
            />

            <!-- Search Results (Mobile) -->
            <SearchResults
              v-if="scannerMode === 'search'"
              :search-results="searchResults"
              :unified-input="unifiedInput"
              :is-processing="isProcessing"
              :is-searching="isSearching"
              @select-result="lookupResult = $event; showLookupModal = true"
            />
          </template>

          <!-- Scan History (Always shown outside scanner) -->
          <ScanHistory
            v-if="scanHistory.length > 0"
            :scan-history="scanHistory"
            :recent-scans="recentScans"
            :successful-scans="successfulScans"
            :failed-scans="failedScans"
            :scanner-focus-locked="scannerFocusLocked"
            @export-history="exportHistory"
            @clear-history="confirmClearHistory"
            @registration-action="handleRegistrationAction"
          />
        </div>
      </Transition>
    </div>

    <!-- Error state -->
    <div v-else class="mt-8">
      <Card>
        <CardContent class="p-8 text-center">
          <Icon icon="heroicons:exclamation-triangle" class="mx-auto mb-4 size-12 text-yellow-500" />
          <h3 class="mb-2 text-lg font-semibold">
            Unable to Load Scanner
          </h3>
          <p class="mb-4 text-muted-foreground">
            Failed to load scanner settings. Please check your permissions and try again.
          </p>
          <Button @click="loadScannerSettings">
            <Icon icon="heroicons:arrow-path" class="mr-2 size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- Confirmation Dialog for Clear History -->
  <Dialog v-model:open="showClearConfirmDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon icon="heroicons:exclamation-triangle" class="size-5 text-amber-500" />
          Clear Scan History
        </DialogTitle>
        <DialogDescription>
          Are you sure you want to clear all scan history in this session?
          This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <div class="my-4 rounded-lg bg-muted/50 p-3">
        <div class="text-sm text-muted-foreground">
          <div class="mb-2 flex items-center justify-between">
            <span>Total entries:</span>
            <Badge variant="outline">
              {{ scanHistory.length }}
            </Badge>
          </div>
          <div class="mb-2 flex items-center justify-between">
            <span>Successful scans:</span>
            <Badge variant="outline" class="bg-green-50 text-green-700">
              {{ successfulScans }}
            </Badge>
          </div>
          <div class="flex items-center justify-between">
            <span>Failed scans:</span>
            <Badge variant="outline" class="bg-red-50 text-red-700">
              {{ failedScans }}
            </Badge>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="showClearConfirmDialog = false">
          Cancel
        </Button>
        <Button variant="destructive" @click="clearHistory">
          <Icon icon="heroicons:trash" class="mr-2 size-4" />
          Clear History
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
