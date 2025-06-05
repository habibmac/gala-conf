<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDebounceFn, useClipboard } from '@vueuse/core';
import { useRoute } from 'vue-router';
import { useToast } from '@/components/ui/toast/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@iconify/vue';

import EnhancedQRScanner from '~/components/partials/scanner/EnhancedQRScanner.vue';
import ScanResultModal from '~/components/partials/scanner/ScanResultModal.vue';
import SimpleQRScanner from '~/components/partials/scanner/SimpleQRScanner.vue';

import type { RegistrationData, ScanHistoryItem, ScannerMode, ScannerSettings } from '~/types';

type CapabilityKey = keyof ScannerSettings['capabilities'];

type SupportedBarcodeFormat = 
  | "qr_code" 
  | "code_128" 
  | "code_39" 
  | "ean_13" 
  | "ean_8" 
  | "code_93" 
  | "upc_a" 
  | "upc_e" 
  | "itf" 
  | "pdf417" 
  | "data_matrix" 
  | "aztec" 
  | "codabar" 
  | "databar" 
  | "databar_expanded";

definePageMeta({
  title: 'Ticket Scanner',
  group: 'tools',
  showInMenu: true,
  icon: 'solar:code-scan-line-duotone',
  requiresSelectedEvent: true,
  packages: ['optima'],
  roles: ['administrator', 'ee_event_organizer'],
  capabilities: ['ee_read_checkins'],
  layout: 'dashboard-with-sidebar',
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

const scannerStatus = ref<string>('inactive');
const lastError = ref<string>('');
const scannerRef = ref<InstanceType<typeof EnhancedQRScanner> | null>(null);
const showScanResult = ref(false);
const currentScanResult = ref<RegistrationData | null>(null);

// Search functionality
const searchResults = ref<RegistrationData[]>([]);

// Lookup result
const lookupResult = ref<RegistrationData | null>(null);

const eventId = computed(() => route.params.eventId as string);
const canScan = computed(() => !!selectedDatetime.value && !!scannerSettings.value);
const recentScans = computed(() => scanHistory.value.slice(0, 10));
const successfulScans = computed(() => scanHistory.value.filter((scan) => scan.status === 'success').length);
const failedScans = computed(() => scanHistory.value.filter((scan) => scan.status === 'error').length);

const showClearConfirmDialog = ref(false);
const { copy, copied, isSupported } = useClipboard();

// Scanner mode configuration
const modeConfig = computed(() => ({
  lookup: {
    title: 'Lookup Mode',
    description: 'Scan or enter code to view registration details',
    icon: 'heroicons:qr-code',
    color: 'blue',
    capability: 'lookup' as CapabilityKey,
  },
  continuous: {
    title: 'Continuous Check-in',
    description: 'Automatic check-in mode for high volume',
    icon: 'heroicons:bolt',
    color: 'orange',
    capability: 'continuous_scan' as CapabilityKey,
  },
  search: {
    title: 'Search Mode',
    description: 'Search registrations by name, email, or code',
    icon: 'heroicons:magnifying-glass',
    color: 'green',
    capability: 'search' as CapabilityKey,
  },
}));

const scannerInstructions = computed(() => [
  {
    title: 'Select Session',
    description: 'Choose the active session for scanning.',
  },
  {
    title: 'Choose Input Mode',
    description: 'Use camera scanner or manual entry.',
  },
  {
    title: 'Process & Review',
    description: 'View results and take actions as needed.',
  },
]);

// Available scanner modes for the dropdown
const availableModes = computed(() => {
  if (!scannerSettings.value?.capabilities) return [];

  return Object.entries(modeConfig.value)
    .filter(([key, config]) => {
      // Use the capability mapping from modeConfig
      const requiredCapability = config.capability;
      return scannerSettings.value?.capabilities?.[requiredCapability] ?? false;
    })
    .map(([key, config]) => ({
      value: key,
      label: config.title,
      description: config.description,
      icon: config.icon,
      color: config.color,
    }));
});

const loadScannerSettings = async () => {
  try {
    isLoading.value = true;
    const response = await $galantisApi.get(`/event/${eventId.value}/scanner/details`);

    let scannerData = null;

    if (response.data && response.data.success && response.data.data) {
      scannerData = response.data.data;
    } else if (response.data && response.data.event) {
      scannerData = response.data;
    }

    if (scannerData && scannerData.event) {
      scannerSettings.value = scannerData;

      if (scannerSettings.value?.datetimes) {
        const activeDateTime = scannerSettings.value.datetimes.find((dt) => dt.is_active);
        if (activeDateTime) {
          selectedDatetime.value = activeDateTime.id;
        } else if (scannerSettings.value.datetimes.length > 0) {
          selectedDatetime.value = scannerSettings.value.datetimes[0].id;
        }

        // Set supported formats
        supportedFormats.value = scannerSettings.value.supported_formats || [];
      }
    } else {
      throw new Error('Invalid response format from scanner API');
    }
  } catch (error: any) {
    console.error('Failed to load scanner settings:', error);

    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });

    let errorMessage = 'Failed to load scanner settings';

    if (error.response?.status === 401) {
      errorMessage = 'Authentication failed. Please log in again.';
    } else if (error.response?.status === 403) {
      errorMessage = 'You do not have permission to access the scanner.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Scanner endpoint not found. Please check if the event exists.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    toast({
      title: 'Scanner Error',
      description: errorMessage,
      variant: 'destructive',
    });
  } finally {
    isLoading.value = false;
  }
};

const performLookup = async (code: string) => {
  if (!selectedDatetime.value) return;

  try {
    const response = await $galantisApi.post(`/event/${eventId.value}/scanner/lookup`, {
      barcode: code,
      datetime_id: selectedDatetime.value,
    });

    if (response.data.success) {
      lookupResult.value = response.data.registration;

      const scanEntry: ScanHistoryItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code,
        timestamp: Date.now(),
        status: 'lookup',
        message: 'Registration found',
        attendeeName: response.data.registration?.attendee?.full_name,
        registrationData: response.data.registration,
      };

      scanHistory.value.unshift(scanEntry);
    } else {
      throw new Error(response.data.message || 'Registration not found');
    }
  } catch (error: any) {
    handleScanError(
      { rawValue: code, format: 'manual', timestamp: Date.now() },
      error.response?.data?.message || 'Lookup failed'
    );
  }
};

const performCheckin = async (code: string, action = 'checkin') => {
  if (!selectedDatetime.value) return;

  try {
    const response = await $galantisApi.post(`/event/${eventId.value}/scanner/checkin`, {
      barcode: code,
      datetime_id: selectedDatetime.value,
      action: action,
      check_approved: true,
    });

    if (response.data.success) {
      const scanEntry: ScanHistoryItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code,
        timestamp: Date.now(),
        status: 'success',
        message: `${action} successful`,
        attendeeName: response.data.registration?.attendee?.full_name,
        action: response.data.action_taken,
        registrationData: response.data.registration,
      };

      scanHistory.value.unshift(scanEntry);

      toast({
        title: `${action} Successful ✅`,
        description: `${response.data.registration?.attendee?.full_name || 'Attendee'} ${action} completed`,
      });

      playSuccessSound();
      return response.data;
    } else {
      throw new Error(response.data.message || `${action} failed`);
    }
  } catch (error: any) {
    handleScanError(
      { rawValue: code, format: 'manual', timestamp: Date.now() },
      error.response?.data?.message || `${action} failed`
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
  if (!unifiedInput.value.trim() || !selectedDatetime.value) return;

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
  } finally {
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
      keyword: searchTerm,
      datetime_id: selectedDatetime.value,
      limit: 20,
    });

    if (response.data.success) {
      searchResults.value = response.data.results;
    } else {
      searchResults.value = [];
    }
  } catch (error: any) {
    console.error('Search error:', error);
    searchResults.value = [];
    toast({
      title: 'Search Error',
      description: error.response?.data?.message || 'Search failed',
      variant: 'destructive',
    });
  } finally {
    isSearching.value = false;
  }
}, 300); // 300ms debounce delay

const performSearch = async () => {
  debouncedSearch(unifiedInput.value);
};

const handleScanResult = async (result: { rawValue: string; format: string; timestamp: number }) => {
  if (isProcessing.value || !selectedDatetime.value) return;

  console.log('🎯 Barcode detected:', result);

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
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code: result.rawValue,
        timestamp: Date.now(),
        status: 'lookup',
        message: 'Registration found',
        attendeeName: response.data.registration?.attendee?.full_name,
        registrationData: response.data.registration,
      };
      scanHistory.value.unshift(scanEntry);

      // Show result modal
      showScanResult.value = true;

      // Auto check-in for continuous mode
      if (scannerMode.value === 'continuous' && response.data.registration.can_checkin) {
        await handleRegistrationAction(response.data.registration, 'checkin');
      }
    } else {
      throw new Error(response.data.message || 'Registration not found');
    }
  } catch (error: any) {
    handleScanError(
      { rawValue: result.rawValue, format: result.format, timestamp: result.timestamp },
      error.response?.data?.message || 'Lookup failed'
    );
  } finally {
    isProcessing.value = false;
  }
};

const handleScanError = (result: { rawValue: string; format: string; timestamp: number }, message: string) => {
  const scanEntry: ScanHistoryItem = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    code: result.rawValue,
    timestamp: result.timestamp,
    status: 'error',
    message,
  };

  scanHistory.value.unshift(scanEntry);

  // Show different toast styles for payment errors
  const isPaymentError = message.includes('Payment') || message.includes('payment');

  toast({
    title: isPaymentError ? 'Payment Required ⚠️' : 'Scan Error ⚠️',
    description: message,
    variant: 'destructive',
  });

  playErrorSound();
};

const handleScannerError = (error: string) => {
  toast({
    title: 'Scanner Error',
    description: error,
    variant: 'destructive',
  });
};

const toggleScanner = () => {
  if (!canScan.value) {
    toast({
      title: 'Cannot Start Scanner',
      description: 'Please select a datetime session first',
      variant: 'destructive',
    });
    return;
  }

  isScannerOpen.value = !isScannerOpen.value;
};

const confirmClearHistory = () => {
  if (scanHistory.value.length === 0) {
    toast({
      title: 'Nothing to Clear',
      description: 'Scan history is already empty',
    });
    return;
  }

  showClearConfirmDialog.value = true;
};

const clearHistory = () => {
  scanHistory.value = [];
  showClearConfirmDialog.value = false;
  toast({
    title: 'History Cleared',
    description: 'Scan history has been cleared',
  });
};

const exportHistory = () => {
  if (scanHistory.value.length === 0) return;

  const data = scanHistory.value.map((scan) => ({
    timestamp: formatTimestamp(scan.timestamp),
    code: scan.code,
    status: scan.status,
    message: scan.message || '',
    attendee: scan.attendeeName || '',
    action: scan.action || '',
  }));

  const csv = [
    'Timestamp,Code,Status,Message,Attendee,Action',
    ...data.map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(',')
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

const playSuccessSound = () => {
  try {
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {}
};

const playErrorSound = () => {
  try {
    const audio = new Audio('/sounds/error.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {}
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
  } catch (error) {
    console.error('Registration action failed:', error);
  }
};

const copyToClipboard = async (text: string) => {
  if (!isSupported.value) {
    // Fallback for browsers that don't support clipboard API
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied! 📋',
        description: `Registration code "${text}" copied to clipboard`,
      });
    } catch (err) {
      // Final fallback - create a temporary input element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      toast({
        title: 'Copied! 📋',
        description: `Registration code "${text}" copied to clipboard`,
      });
    }
    return;
  }

  try {
    await copy(text);
    toast({
      title: 'Copied! 📋',
      description: `Registration code "${text}" copied to clipboard`,
    });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    toast({
      title: 'Copy Failed',
      description: 'Failed to copy registration code to clipboard',
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

const handleInputChange = (value: string) => {
  unifiedInput.value = value;
};

const enhancedFormats = computed((): SupportedBarcodeFormat[] => {
  // Default Event Espresso formats
  const eventEspressoFormats: SupportedBarcodeFormat[] = ['qr_code', 'code_128', 'code_39', 'ean_13'];
  
  // Use API formats if available, otherwise fall back to defaults
  const apiFormats = supportedFormats.value?.length > 0 
    ? supportedFormats.value.filter((format): format is SupportedBarcodeFormat => 
        ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'code_93', 'upc_a', 'upc_e', 'itf', 'pdf417', 'data_matrix', 'aztec', 'codabar', 'databar', 'databar_expanded'].includes(format as SupportedBarcodeFormat)
      )
    : eventEspressoFormats;

  console.log('📋 Using formats for Event Espresso:', apiFormats);
  return apiFormats;
});

const handleEnhancedScannerError = (error: string) => {
  lastError.value = error;
  scannerStatus.value = 'error';
  console.error('❌ Scanner error:', error);

  // More specific error handling
  if (error.includes('permission')) {
    toast({
      title: 'Camera Permission Required',
      description: 'Please allow camera access to use the scanner. Check your browser settings.',
      variant: 'destructive',
    });
  } else if (error.includes('https')) {
    toast({
      title: 'HTTPS Required',
      description: 'Camera access requires HTTPS connection for security reasons.',
      variant: 'destructive',
    });
  } else {
    handleScannerError(error);
  }
};

// Enhanced scanner event handlers
const handleScannerStarted = () => {
  scannerStatus.value = 'active';
  lastError.value = '';
  console.log('✅ Scanner started successfully');
};

const handleScannerStopped = () => {
  scannerStatus.value = 'inactive';
  console.log('🛑 Scanner stopped');
};

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
  }
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
    } else {
      // Clear search results when not in search mode
      searchResults.value = [];
    }
  }
);

// Clear search results when datetime changes
watch(
  () => selectedDatetime.value,
  () => {
    if (scannerMode.value === 'search' && unifiedInput.value.trim()) {
      debouncedSearch(unifiedInput.value);
    }
  }
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
onBeforeRouteLeave((to, from) => {
  if (scanHistory.value.length > 0) {
    const answer = window.confirm(
      `You have ${scanHistory.value.length} scan history entries. Are you sure you want to leave this page? Your scan history will be lost.`
    );

    if (!answer) {
      return false; // Cancel the navigation
    }
  }
  return true; // Allow navigation
});

useHead({
  title: 'Ticket Scanner',
  meta: [
    {
      name: 'description',
      content: 'Advanced scanner for managing event registrations and check-ins.',
    },
  ],
});
</script>

<template>
  <div class="container mx-auto mb-20">
    <div class="flex flex-col sm:flex-row justify-between items-start pt-10 gap-5">
      <header class="sm:grow">
        <h1 class="h2">Ticket Scanner</h1>
        <p class="text-muted-foreground mt-2 max-w-2xl">
          Use the scanner to check in attendees, search registrations, or look up details by scanning barcodes or
          entering codes.
        </p>
      </header>
    </div>

    <div v-if="isLoading" class="mt-8">
      <div class="grid gap-4 grid-cols-12">
        <Skeleton v-for="i in 3" :key="i" class="h-32 rounded-xl col-span-12 md:col-span-4" />
      </div>
    </div>

    <div v-else-if="scannerSettings" class="mt-8 space-y-6">
      <div class="grid gap-4">
        <div class="w-full max-w-2xl sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center" v-if="scannerSettings">
          <Label class="flex-shrink-0 sm:w-48">
            <span class="text-sm font-medium">Select Session</span>
          </Label>
          <Select v-model="selectedDatetime">
            <SelectTrigger class="h-12 bg-card max-w-80 sm:max-w-none dark:bg-background">
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

        <div class="flex flex-col sm:flex-row gap-2">
          <div class="max-w-md flex-shrink-0">
            <Select v-model="scannerMode" class="w-full">
              <SelectTrigger class="h-12 sm:w-60 bg-card dark:bg-background">
                <SelectValue placeholder="Select scanner mode">
                  <div class="flex items-center gap-2 font-medium">
                    <Icon
                      :icon="modeConfig[scannerMode].icon"
                      class="w-5 h-5 text-muted-foreground"
                      :style="{ color: modeConfig[scannerMode].color }"
                    />
                    <span>{{ modeConfig[scannerMode].title }}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="mode in availableModes" :key="mode.value" :value="mode.value" class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <Icon :icon="mode.icon" class="w-5 h-5" :style="{ color: mode.color }" />
                    <span class="font-medium">{{ mode.label }}</span>
                  </div>
                  <div class="text-xs text-muted-foreground mt-1">
                    {{ mode.description }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            v-model="unifiedInput"
            :placeholder="getInputPlaceholder()"
            class="grow bg-card dark:bg-background h-12 text-base"
            @keyup.enter="handleUnifiedAction"
          />

          <Button
            @click="handleUnifiedAction"
            :disabled="!unifiedInput.trim() || isProcessing || isSearching"
            class="h-12 flex-1 sm:flex-none"
          >
            <Icon
              v-if="isProcessing || (scannerMode === 'search' && isSearching)"
              icon="svg-spinners:ring-resize"
              class="w-4 h-4 mr-2"
            />
            {{ getActionButtonLabel() }}
          </Button>

          <Button
            @click="toggleScanner"
            class="h-12 bg-amber-500 hover:bg-amber-600 flex-1 sm:flex-none"
            :disabled="!canScan"
          >
            <Icon :icon="isScannerOpen ? 'heroicons:x-mark' : 'heroicons:camera'" class="w-5 h-5 mr-2" />
            {{ isScannerOpen ? 'Close Camera' : 'Use Camera' }}
          </Button>
        </div>
      </div>

      <div v-if="isScannerOpen" class="mt-8">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Icon icon="heroicons:camera" class="w-5 h-5" />
              Camera Scanner
              <Badge v-if="isProcessing" variant="secondary" class="ml-2">
                <Icon icon="svg-spinners:ring-resize" class="w-4 h-4 mr-1" />
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
          <div class="border rounded-lg p-4 space-y-3">
            <div class="flex flex-col items-center justify-between">
              <h4 class="font-semibold">{{ lookupResult.attendee.full_name }}</h4>
              <Badge :variant="lookupResult.can_checkin ? 'default' : 'secondary'">
                {{ lookupResult.checkin_status_text }}
              </Badge>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div>
                <ClientOnly>
                  <Qrcode :value="lookupResult.code" class="w-16 h-16 mr-4" />
                </ClientOnly>
              </div>
              <div class="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-muted-foreground">Code:</span>
                  <span class="ml-2 font-semibold">{{ lookupResult.code }}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-6 w-6 p-0 hover:bg-muted"
                    @click="copyToClipboard(lookupResult.code)"
                    :title="`Copy ${lookupResult.code}`"
                  >
                    <Icon icon="heroicons:document-duplicate" class="w-3 h-3" />
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

              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div
                  v-for="result in searchResults"
                  :key="result.id"
                  class="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  :class="{
                    'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20':
                      result.payment_validation && !result.payment_validation.can_checkin_payment,
                  }"
                  @click="lookupResult = result"
                >
                  <div class="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
                    <div class="flex-1">
                      <div class="font-medium">{{ result.attendee.full_name }}</div>
                      <div class="text-sm text-muted-foreground">{{ result.code }} • {{ result.ticket.name }}</div>
                      <div class="text-xs text-muted-foreground mt-1">
                        {{ result.attendee.email }}
                      </div>

                      <!-- Payment Status Warning -->
                      <div
                        v-if="result.payment_validation && !result.payment_validation.can_checkin_payment"
                        class="text-xs text-red-600 dark:text-red-400 mt-1 font-medium"
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
              class="text-center text-muted-foreground py-4"
            >
              <Icon icon="heroicons:magnifying-glass" class="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                <Icon icon="heroicons:arrow-down-tray" class="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" @click="confirmClearHistory">
                <Icon icon="heroicons:trash" class="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="scan in recentScans"
                :key="scan.id"
                class="flex items-start justify-between p-3 rounded-lg border"
                :class="{
                  'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800': scan.status === 'success',
                  'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800': scan.status === 'lookup',
                  'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800': scan.status === 'error',
                }"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
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
                      class="w-4 h-4 flex-shrink-0"
                    />
                    <span class="text-sm font-medium truncate">{{ scan.code }}</span>
                    <Badge v-if="scan.action" variant="outline" class="text-xs">
                      {{ scan.action }}
                    </Badge>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    {{ formatTimestamp(scan.timestamp) }}
                  </p>
                  <p v-if="scan.attendeeName" class="text-sm font-medium mt-1">
                    {{ scan.attendeeName }}
                  </p>
                  <p
                    v-if="scan.message"
                    class="text-xs mt-1"
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
                    <Icon icon="heroicons:arrow-right-end-on-rectangle" class="w-3 h-3" />
                  </Button>
                  <Button
                    v-if="scan.registrationData.can_checkout"
                    size="sm"
                    variant="outline"
                    @click="handleRegistrationAction(scan.registrationData, 'checkout')"
                  >
                    <Icon icon="heroicons:arrow-left-start-on-rectangle" class="w-3 h-3" />
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
              <Icon icon="heroicons:chart-bar" class="w-5 h-5 text-muted-foreground" />
              Session Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-500">{{ Number(scannerSettings.stats.total_checkins) }}</div>
                <div class="text-sm text-muted-foreground">Check-ins</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-500">
                  {{ Number(scannerSettings.stats.currently_checked_in) }}
                </div>
                <div class="text-sm text-muted-foreground">Currently Here</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-500">{{ successfulScans }}</div>
                <div class="text-sm text-muted-foreground">Successful</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-500">{{ failedScans }}</div>
                <div class="text-sm text-muted-foreground">Failed</div>
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
                  <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span class="text-sm font-semibold text-primary">{{ index + 1 }}</span>
                  </div>
                  <div>
                    <h4 class="font-semibold">{{ step.title }}</h4>
                    <p class="text-sm text-muted-foreground">{{ step.description }}</p>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="font-semibold">Scanner Modes</h4>
                <div class="space-y-2 text-sm">
                  <div v-for="mode in availableModes" :key="mode.value" class="flex items-center gap-2">
                    <Icon :icon="mode.icon" class="w-4 h-4" :style="{ color: mode.color }" />
                    <span
                      ><strong>{{ mode.label }}:</strong> {{ mode.description }}</span
                    >
                  </div>
                </div>

                <div class="mt-4">
                  <h4 class="font-semibold mb-2">Supported Formats</h4>
                  <div class="grid grid-cols-2 gap-1 text-xs">
                    <div v-for="format in supportedFormats" :key="format" class="flex items-center gap-2">
                      <Icon icon="heroicons:bars-3" class="w-4 h-4" />
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
          <Icon icon="heroicons:exclamation-triangle" class="w-12 h-12 mx-auto text-yellow-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2">Unable to Load Scanner</h3>
          <p class="text-muted-foreground mb-4">
            Failed to load scanner settings. Please check your permissions and try again.
          </p>
          <Button @click="loadScannerSettings">
            <Icon icon="heroicons:arrow-path" class="w-4 h-4 mr-2" />
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
          <Icon icon="heroicons:exclamation-triangle" class="w-5 h-5 text-amber-500" />
          Clear Scan History
        </DialogTitle>
        <DialogDescription>
          Are you sure you want to clear all scan history? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <div class="bg-muted/50 rounded-lg p-3 my-4">
        <div class="text-sm text-muted-foreground">
          <div class="flex justify-between items-center mb-2">
            <span>Total entries:</span>
            <Badge variant="outline">{{ scanHistory.length }}</Badge>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span>Successful scans:</span>
            <Badge variant="outline" class="bg-green-50 text-green-700">{{ successfulScans }}</Badge>
          </div>
          <div class="flex justify-between items-center">
            <span>Failed scans:</span>
            <Badge variant="outline" class="bg-red-50 text-red-700">{{ failedScans }}</Badge>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="showClearConfirmDialog = false"> Cancel </Button>
        <Button variant="destructive" @click="clearHistory">
          <Icon icon="heroicons:trash" class="w-4 h-4 mr-2" />
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
