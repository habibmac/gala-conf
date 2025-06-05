<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useClipboard, useDebounceFn } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import type { ApiError, RegistrationData, ScanHistoryItem, ScannerMode, ScannerSettings } from '~/types';

import ScanResultModal from '@/components/partials/scanner/ScanResultModal.vue';
import SimpleQRScanner from '@/components/partials/scanner/SimpleQRScanner.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast/use-toast';

type CapabilityKey = keyof ScannerSettings['capabilities'];

type SupportedBarcodeFormat =
  | 'qr_code'
  | 'code_128'
  | 'code_39'
  | 'ean_13'
  | 'ean_8'
  | 'code_93'
  | 'upc_a'
  | 'upc_e'
  | 'itf'
  | 'pdf417'
  | 'data_matrix'
  | 'aztec'
  | 'codabar'
  | 'databar'
  | 'databar_expanded';

definePageMeta({
  capabilities: ['ee_read_checkins'],
  group: 'tools',
  icon: 'solar:code-scan-line-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer'],
  showInMenu: true,
  title: 'Ticket Scanner',
});

const route = useRoute();
const { $galantisApi } = useNuxtApp();
const { toast } = useToast();

const isLoading = ref(true);
const scannerSettings = ref<ScannerSettings | null>(null);
const selectedDatetime = ref<string>('');
const isScannerOpen = ref(false);
const scanHistory = ref<ScanHistoryItem[]>([]);
const unifiedInput = ref('');
const isProcessing = ref(false);
const scannerMode = ref<ScannerMode>('lookup');
const isSearching = ref(false);
const supportedFormats = ref<string[]>([]);

const showScanResult = ref(false);
const currentScanResult = ref<RegistrationData | null>(null);

// Search functionality
const searchResults = ref<RegistrationData[]>([]);

// Lookup result
const lookupResult = ref<RegistrationData | null>(null);

const eventId = computed(() => route.params.eventId as string);
const canScan = computed(() => !!selectedDatetime.value && !!scannerSettings.value);
const recentScans = computed(() => scanHistory.value.slice(0, 10));
const successfulScans = computed(() => scanHistory.value.filter(scan => scan.status === 'success').length);
const failedScans = computed(() => scanHistory.value.filter(scan => scan.status === 'error').length);

const showClearConfirmDialog = ref(false);
const { copy, isSupported } = useClipboard();

// Scanner mode configuration
const modeConfig = computed(() => ({
  continuous: {
    capability: 'continuous_scan' as CapabilityKey,
    color: 'orange',
    description: 'Automatic check-in mode for high volume',
    icon: 'heroicons:bolt',
    title: 'Continuous Check-in',
  },
  lookup: {
    capability: 'lookup' as CapabilityKey,
    color: 'blue',
    description: 'Scan or enter code to view registration details',
    icon: 'heroicons:qr-code',
    title: 'Lookup Mode',
  },
  search: {
    capability: 'search' as CapabilityKey,
    color: 'green',
    description: 'Search registrations by name, email, or code',
    icon: 'heroicons:magnifying-glass',
    title: 'Search Mode',
  },
}));

const scannerInstructions = computed(() => [
  {
    description: 'Choose the active session for scanning.',
    title: 'Select Session',
  },
  {
    description: 'Use camera scanner or manual entry.',
    title: 'Choose Input Mode',
  },
  {
    description: 'View results and take actions as needed.',
    title: 'Process & Review',
  },
]);

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
    const response = await $galantisApi.get(`/event/${eventId.value}/scanner/details`);

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
        const activeDateTime = scannerSettings.value.datetimes.find(dt => dt.is_active);
        if (activeDateTime) {
          selectedDatetime.value = activeDateTime.id;
        }
        else if (scannerSettings.value.datetimes.length > 0) {
          selectedDatetime.value = scannerSettings.value.datetimes[0].id;
        }

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

    toast({
      description: errorMessage,
      title: 'Scanner Error',
      variant: 'destructive',
    });
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
      lookupResult.value = response.data.registration;

      const scanEntry: ScanHistoryItem = {
        attendeeName: response.data.registration?.attendee?.full_name,
        code,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Registration found',
        registrationData: response.data.registration,
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
      const scanEntry: ScanHistoryItem = {
        action: response.data.action_taken,
        attendeeName: response.data.registration?.attendee?.full_name,
        code,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: `${action} successful`,
        registrationData: response.data.registration,
        status: 'success',
        timestamp: Date.now(),
      };

      scanHistory.value.unshift(scanEntry);

      toast({
        description: `${response.data.registration?.attendee?.full_name || 'Attendee'} ${action} completed`,
        title: `${action} Successful ✅`,
      });

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

const getInputPlaceholder = () => {
  switch (scannerMode.value) {
    case 'search':
      return 'Search by name, email, or registration code...';
    case 'lookup':
      return 'Enter registration code to lookup...';
    case 'continuous':
      return 'Enter registration code to check in...';
    default:
      return 'Enter registration code...';
  }
};

const getActionButtonLabel = () => {
  switch (scannerMode.value) {
    case 'search':
      return 'Search';
    case 'lookup':
      return 'Lookup';
    case 'continuous':
      return 'Check In';
    default:
      return 'Process';
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
      keyword: searchTerm,
      limit: 20,
    });

    if (response.data.success) {
      searchResults.value = response.data.results;
    }
    else {
      searchResults.value = [];
    }
  }
  catch (error: unknown) {
    searchResults.value = [];

    const apiError = error as ApiError;
    toast({
      description: apiError.response?.data?.message || 'Search failed',
      title: 'Search Error',
      variant: 'destructive',
    });
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

  console.warn('🎯 Barcode detected:', result);

  isProcessing.value = true;

  try {
    // Always do lookup first to get registration data
    const response = await $galantisApi.post(`/event/${eventId.value}/scanner/lookup`, {
      barcode: result.rawValue,
      datetime_id: selectedDatetime.value,
    });

    if (response.data.success) {
      currentScanResult.value = response.data.registration;

      // Add to scan history
      const scanEntry: ScanHistoryItem = {
        attendeeName: response.data.registration?.attendee?.full_name,
        code: result.rawValue,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Registration found',
        registrationData: response.data.registration,
        status: 'lookup',
        timestamp: Date.now(),
      };
      scanHistory.value.unshift(scanEntry);

      // Show result modal
      showScanResult.value = true;

      // Auto check-in for continuous mode
      if (scannerMode.value === 'continuous' && response.data.registration.can_checkin) {
        await handleRegistrationAction(response.data.registration, 'checkin');
      }
    }
    else {
      throw new Error(response.data.message || 'Registration not found');
    }
  }
  catch (error: unknown) {
    const apiError = error as ApiError;
    handleScanError(
      { format: result.format, rawValue: result.rawValue, timestamp: result.timestamp },
      apiError.response?.data?.message || 'Lookup failed',
    );
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

  toast({
    description: message,
    title: isPaymentError ? 'Payment Required ⚠️' : 'Scan Error ⚠️',
    variant: 'destructive',
  });
};

const handleScannerError = (error: string) => {
  toast({
    description: error,
    title: 'Scanner Error',
    variant: 'destructive',
  });
};

const toggleScanner = () => {
  if (!canScan.value) {
    toast({
      description: 'Please select a datetime session first',
      title: 'Cannot Start Scanner',
      variant: 'destructive',
    });
    return;
  }

  isScannerOpen.value = !isScannerOpen.value;
};

const confirmClearHistory = () => {
  if (scanHistory.value.length === 0) {
    toast({
      description: 'Scan history is already empty',
      title: 'Nothing to Clear',
    });
    return;
  }

  showClearConfirmDialog.value = true;
};

const clearHistory = () => {
  scanHistory.value = [];
  showClearConfirmDialog.value = false;
  toast({
    description: 'Scan history has been cleared',
    title: 'History Cleared',
  });
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

const handleRegistrationAction = async (registration: RegistrationData, action: 'checkin' | 'checkout') => {
  try {
    const result = await performCheckin(registration.code, action);

    // Update current result if it matches
    if (currentScanResult.value?.id === registration.id && result) {
      currentScanResult.value = result.registration;
    }

    // Close modal after successful action
    showScanResult.value = false;

    // Show success toast (already handled in performCheckin)
  }
  catch (error) {
    console.error('Registration action failed:', error);
  }
};

const copyToClipboard = async (text: string) => {
  if (!isSupported.value) {
    // Fallback for browsers that don't support clipboard API
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: `Registration code "${text}" copied to clipboard`,
        title: 'Copied! 📋',
      });
    }
    catch (error: unknown) {
      console.error('Failed to copy to clipboard:', error);

      // Final fallback - create a temporary input element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      toast({
        description: `Registration code "${text}" copied to clipboard`,
        title: 'Copied! 📋',
      });
    }
    return;
  }

  try {
    await copy(text);
    toast({
      description: `Registration code "${text}" copied to clipboard`,
      title: 'Copied! 📋',
    });
  }
  catch (error) {
    console.error('Failed to copy to clipboard:', error);
    toast({
      description: 'Failed to copy registration code to clipboard',
      title: 'Copy Failed',
      variant: 'destructive',
    });
  }
};

const displayFormat = (format: string) => {
  switch (format) {
    case 'qr_code':
      return 'QR Code';
    case 'ean_13':
      return 'EAN-13';
    case 'ean_8':
      return 'EAN-8';
    case 'code_128':
      return 'Code 128';
    case 'code_39':
      return 'Code 39';
    default:
      return format;
  }
};

const enhancedFormats = computed((): SupportedBarcodeFormat[] => {
  // Default Event Espresso formats
  const eventEspressoFormats: SupportedBarcodeFormat[] = ['qr_code', 'code_128', 'code_39', 'ean_13'];

  // Use API formats if available, otherwise fall back to defaults
  const apiFormats
    = supportedFormats.value?.length > 0
      ? supportedFormats.value.filter((format): format is SupportedBarcodeFormat =>
          [
            'aztec',
            'codabar',
            'code_39',
            'code_93',
            'code_128',
            'data_matrix',
            'databar',
            'databar_expanded',
            'ean_8',
            'ean_13',
            'itf',
            'pdf417',
            'qr_code',
            'upc_a',
            'upc_e',
          ].includes(format as SupportedBarcodeFormat),
        )
      : eventEspressoFormats;

  console.warn('📋 Using formats for Event Espresso:', apiFormats);
  return apiFormats;
});

// Handle continue scan
const handleContinueScan = () => {
  showScanResult.value = false;
  // Scanner automatically continues
};

// Handle switch to lookup
const handleSwitchToLookup = () => {
  showScanResult.value = false;
  scannerMode.value = 'lookup';
  isScannerOpen.value = false;

  // Set the scanned value in the input
  if (currentScanResult.value) {
    unifiedInput.value = currentScanResult.value.code;
    lookupResult.value = currentScanResult.value;
  }
};

// Watch for changes in unified input when in search mode
watch(
  () => unifiedInput.value,
  (newValue) => {
    if (scannerMode.value === 'search') {
      debouncedSearch(newValue);
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

onMounted(() => {
  loadScannerSettings();

  // Add beforeunload listener
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (scanHistory.value.length > 0) {
      event.preventDefault();
      event.returnValue = 'You have scan history that will be lost. Are you sure you want to leave?';
      return event.returnValue;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Clean up the event listener
  onUnmounted(() => {
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
    <div class="flex flex-col items-start justify-between gap-5 pt-10 sm:flex-row">
      <header class="sm:grow">
        <h1 class="h2">
          Ticket Scanner
        </h1>
        <p class="mt-2 max-w-2xl text-muted-foreground">
          Use the scanner to check in attendees, search registrations, or look up details by scanning barcodes or
          entering codes.
        </p>
      </header>
    </div>

    <div v-if="isLoading" class="mt-8">
      <div class="grid grid-cols-12 gap-4">
        <Skeleton v-for="i in 3" :key="i" class="col-span-12 h-32 rounded-xl md:col-span-4" />
      </div>
    </div>

    <div v-else-if="scannerSettings" class="mt-8 space-y-6">
      <div class="grid gap-4">
        <div v-if="scannerSettings" class="flex w-full max-w-2xl flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Label class="shrink-0 sm:w-48">
            <span class="text-sm font-medium">Select Session</span>
          </Label>
          <Select v-model="selectedDatetime">
            <SelectTrigger class="h-12 max-w-80 bg-card dark:bg-background sm:max-w-none">
              <SelectValue placeholder="Select a session" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem v-for="datetime in scannerSettings.datetimes" :key="datetime.id" :value="datetime.id">
                {{ datetime.name }}
                <span v-if="datetime.available !== null"> ({{ datetime.available }} available) </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <div class="max-w-md shrink-0">
            <Select v-model="scannerMode" class="w-full">
              <SelectTrigger class="h-12 bg-card dark:bg-background sm:w-60">
                <SelectValue placeholder="Select scanner mode">
                  <div class="flex items-center gap-2 font-medium">
                    <Icon
                      :icon="modeConfig[scannerMode].icon"
                      class="size-5 text-muted-foreground"
                      :style="{ color: modeConfig[scannerMode].color }"
                    />
                    <span>{{ modeConfig[scannerMode].title }}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="mode in availableModes" :key="mode.value" :value="mode.value" class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <Icon :icon="mode.icon" class="size-5" :style="{ color: mode.color }" />
                    <span class="font-medium">{{ mode.label }}</span>
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{ mode.description }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            v-model="unifiedInput"
            :placeholder="getInputPlaceholder()"
            class="h-12 grow bg-card text-base dark:bg-background"
            @keyup.enter="handleUnifiedAction"
          />

          <Button
            :disabled="!unifiedInput.trim() || isProcessing || isSearching"
            class="h-12 flex-1 sm:flex-none"
            @click="handleUnifiedAction"
          >
            <Icon
              v-if="isProcessing || (scannerMode === 'search' && isSearching)"
              icon="svg-spinners:ring-resize"
              class="mr-2 size-4"
            />
            {{ getActionButtonLabel() }}
          </Button>

          <Button
            class="h-12 flex-1 bg-amber-500 hover:bg-amber-600 sm:flex-none"
            :disabled="!canScan"
            @click="toggleScanner"
          >
            <Icon :icon="isScannerOpen ? 'heroicons:x-mark' : 'heroicons:camera'" class="mr-2 size-5" />
            {{ isScannerOpen ? 'Close Camera' : 'Use Camera' }}
          </Button>
        </div>
      </div>

      <div v-if="isScannerOpen" class="mt-8">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Icon icon="heroicons:camera" class="size-5" />
              Camera Scanner
              <Badge v-if="isProcessing" variant="secondary" class="ml-2">
                <Icon icon="svg-spinners:ring-resize" class="mr-1 size-4" />
                Processing...
              </Badge>
            </CardTitle>
            <CardDescription>
              Point the camera at a barcode or QR code. Mode: {{ modeConfig[scannerMode].title }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleQRScanner :formats="enhancedFormats" @detect="handleScanResult" @error="handleScannerError" />
          </CardContent>
        </Card>
      </div>

      <Card v-if="lookupResult && (scannerMode === 'lookup' || scannerMode === 'search')">
        <CardHeader>
          <CardTitle>
            Lookup Result
            <Badge
              v-if="lookupResult.payment_validation && !lookupResult.payment_validation.can_checkin_payment"
              variant="destructive"
              class="ml-2"
            >
              Payment Required
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3 rounded-lg border p-4">
            <div class="flex flex-col items-center justify-between">
              <h4 class="font-semibold">
                {{ lookupResult.attendee.full_name }}
              </h4>
              <Badge :variant="lookupResult.can_checkin ? 'default' : 'secondary'">
                {{ lookupResult.checkin_status_text }}
              </Badge>
            </div>

            <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div>
                <ClientOnly>
                  <Qrcode :value="lookupResult.code" class="mr-4 size-16" />
                </ClientOnly>
              </div>
              <div class="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span class="text-muted-foreground">Code:</span>
                  <span class="ml-2 font-semibold">{{ lookupResult.code }}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="size-6 p-0 hover:bg-muted"
                    :title="`Copy ${lookupResult.code}`"
                    @click="copyToClipboard(lookupResult.code)"
                  >
                    <Icon icon="heroicons:document-duplicate" class="size-3" />
                  </Button>
                </div>
                <div>
                  <span class="text-muted-foreground">Ticket:</span>
                  <span class="ml-2 font-medium">{{ lookupResult.ticket.name }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Email:</span>
                  <span class="ml-2">{{ lookupResult.attendee.email }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Phone:</span>
                  <span class="ml-2">{{ lookupResult.attendee.phone }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <Button
                v-if="lookupResult.can_checkin && lookupResult.checkin_status !== 1"
                size="sm"
                @click="handleRegistrationAction(lookupResult, 'checkin')"
              >
                Check In
              </Button>
              <Button
                v-if="lookupResult.can_checkout"
                size="sm"
                variant="destructive"
                @click="handleRegistrationAction(lookupResult, 'checkout')"
              >
                Check Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Scanner Mode Selection -->
      <Card v-if="scannerMode === 'search'">
        <CardHeader>
          <CardTitle> Search Mode </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Search Results Display -->
            <div v-if="searchResults.length > 0" class="space-y-2">
              <div class="text-sm font-medium text-muted-foreground">
                Found {{ searchResults.length }} result{{ searchResults.length === 1 ? '' : 's' }}
              </div>

              <div class="max-h-96 space-y-2 overflow-y-auto">
                <div
                  v-for="result in searchResults"
                  :key="result.id"
                  class="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  :class="{
                    'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20':
                      result.payment_validation && !result.payment_validation.can_checkin_payment,
                  }"
                  @click="lookupResult = result"
                >
                  <div class="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
                    <div class="flex-1">
                      <div class="font-medium">
                        {{ result.attendee.full_name }}
                      </div>
                      <div class="text-sm text-muted-foreground">
                        {{ result.code }} • {{ result.ticket.name }}
                      </div>
                      <div class="mt-1 text-xs text-muted-foreground">
                        {{ result.attendee.email }}
                      </div>

                      <!-- Payment Status Warning -->
                      <div
                        v-if="result.payment_validation && !result.payment_validation.can_checkin_payment"
                        class="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
                      >
                        ⚠️ {{ result.payment_validation.payment_message }}
                      </div>
                    </div>

                    <div class="flex flex-col items-end gap-1">
                      <!-- Transaction Status Badge -->
                      <Badge v-if="!result.transaction.is_completed" variant="destructive" class="text-xs">
                        {{ result.transaction.status }}
                      </Badge>

                      <!-- Check-in Status Badge -->
                      <Badge :variant="result.can_checkin ? 'outline' : 'secondary'">
                        {{ result.checkin_status_text }}
                      </Badge>

                      <!-- Group registrations indicator -->
                      <div v-if="(result.group_registrations?.length ?? 0) > 0" class="text-xs text-muted-foreground">
                        +{{ result.group_registrations?.length ?? 0 }} group member{{
                          (result.group_registrations?.length ?? 0) === 1 ? '' : 's'
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Search Results -->
            <div
              v-else-if="scannerMode === 'search' && unifiedInput.trim() && searchResults.length === 0 && !isProcessing"
              class="py-4 text-center text-muted-foreground"
            >
              <Icon icon="heroicons:magnifying-glass" class="mx-auto mb-2 size-8 opacity-50" />
              <p>No registrations found for "{{ unifiedInput }}"</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Scan History -->
      <div v-if="scanHistory.length > 0" class="mt-8">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>Recent scans and their results ({{ scanHistory.length }} total)</CardDescription>
            </div>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="exportHistory">
                <Icon icon="heroicons:arrow-down-tray" class="mr-1 size-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" @click="confirmClearHistory">
                <Icon icon="heroicons:trash" class="mr-1 size-4" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="max-h-96 space-y-3 overflow-y-auto">
              <div
                v-for="scan in recentScans"
                :key="scan.id"
                class="flex items-start justify-between rounded-lg border p-3"
                :class="{
                  'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20': scan.status === 'success',
                  'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20': scan.status === 'lookup',
                  'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20': scan.status === 'error',
                }"
              >
                <div class="min-w-0 flex-1">
                  <div class="mb-1 flex items-center gap-2">
                    <Icon
                      :icon="
                        scan.status === 'success'
                          ? 'heroicons:check-circle'
                          : scan.status === 'lookup'
                            ? 'heroicons:magnifying-glass'
                            : 'heroicons:x-circle'
                      "
                      :class="{
                        'text-green-500': scan.status === 'success',
                        'text-blue-500': scan.status === 'lookup',
                        'text-red-500': scan.status === 'error',
                      }"
                      class="size-4 shrink-0"
                    />
                    <span class="truncate text-sm font-medium">{{ scan.code }}</span>
                    <Badge v-if="scan.action" variant="outline" class="text-xs">
                      {{ scan.action }}
                    </Badge>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    {{ formatTimestamp(scan.timestamp) }}
                  </p>
                  <p v-if="scan.attendeeName" class="mt-1 text-sm font-medium">
                    {{ scan.attendeeName }}
                  </p>
                  <p
                    v-if="scan.message"
                    class="mt-1 text-xs"
                    :class="{
                      'text-green-600 dark:text-green-400': scan.status === 'success',
                      'text-blue-600 dark:text-blue-400': scan.status === 'lookup',
                      'text-red-600 dark:text-red-400': scan.status === 'error',
                    }"
                  >
                    {{ scan.message }}
                  </p>
                </div>

                <div v-if="scan.status === 'lookup' && scan.registrationData" class="flex gap-1">
                  <Button
                    v-if="scan.registrationData.can_checkin"
                    size="sm"
                    variant="outline"
                    @click="handleRegistrationAction(scan.registrationData, 'checkin')"
                  >
                    <Icon icon="heroicons:arrow-right-end-on-rectangle" class="size-3" />
                  </Button>
                  <Button
                    v-if="scan.registrationData.can_checkout"
                    size="sm"
                    variant="outline"
                    @click="handleRegistrationAction(scan.registrationData, 'checkout')"
                  >
                    <Icon icon="heroicons:arrow-left-start-on-rectangle" class="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Icon icon="heroicons:chart-bar" class="size-5 text-muted-foreground" />
              Session Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-500">
                  {{ Number(scannerSettings.stats.total_checkins) }}
                </div>
                <div class="text-sm text-muted-foreground">
                  Check-ins
                </div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-500">
                  {{ Number(scannerSettings.stats.currently_checked_in) }}
                </div>
                <div class="text-sm text-muted-foreground">
                  Currently Here
                </div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-500">
                  {{ successfulScans }}
                </div>
                <div class="text-sm text-muted-foreground">
                  Successful
                </div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-500">
                  {{ failedScans }}
                </div>
                <div class="text-sm text-muted-foreground">
                  Failed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Scanner Instructions -->
      <div v-if="!isScannerOpen" class="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Scanner Instructions</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-4">
                <div v-for="(step, index) in scannerInstructions" :key="index" class="flex items-start gap-3">
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span class="text-sm font-semibold text-primary">{{ index + 1 }}</span>
                  </div>
                  <div>
                    <h4 class="font-semibold">
                      {{ step.title }}
                    </h4>
                    <p class="text-sm text-muted-foreground">
                      {{ step.description }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="font-semibold">
                  Scanner Modes
                </h4>
                <div class="space-y-2 text-sm">
                  <div v-for="mode in availableModes" :key="mode.value" class="flex items-center gap-2">
                    <Icon :icon="mode.icon" class="size-4" :style="{ color: mode.color }" />
                    <span><strong>{{ mode.label }}:</strong> {{ mode.description }}</span>
                  </div>
                </div>

                <div class="mt-4">
                  <h4 class="mb-2 font-semibold">
                    Supported Formats
                  </h4>
                  <div class="grid grid-cols-2 gap-1 text-xs">
                    <div v-for="format in supportedFormats" :key="format" class="flex items-center gap-2">
                      <Icon icon="heroicons:bars-3" class="size-4" />
                      {{ displayFormat(format) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
          Are you sure you want to clear all scan history? This action cannot be undone.
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

  <ScanResultModal
    v-if="showScanResult"
    v-model:open="showScanResult"
    :registration="currentScanResult"
    @action="handleRegistrationAction"
    @continue-scan="handleContinueScan"
    @lookup="handleSwitchToLookup"
  />
</template>

<style scoped>
.scan-history-item {
  transition: all 0.2s ease-in-out;
}

.scan-history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mode-indicator {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scanner-input:focus {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border: 2px solid hsl(var(--primary));
  border-radius: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.history-enter-active,
.history-leave-active {
  transition: all 0.3s ease;
}

.history-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.history-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
