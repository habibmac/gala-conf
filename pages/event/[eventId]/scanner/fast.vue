<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { breakpointsTailwind, useBreakpoints, useDebounceFn } from '@vueuse/core';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';

import type { ApiError, RegistrationData, ScanHistoryItem, ScannerMode, ScannerSettings, SupportedBarcodeFormat } from '~/types';

import LookupResult from '@/components/partials/scanner/LookupResult.vue';
import ScanHistory from '@/components/partials/scanner/ScanHistory.vue';
import TicketScanner from '@/components/partials/scanner/TicketScanner.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

definePageMeta({
  capabilities: ['ee_read_checkins'],
  group: 'tools',
  icon: 'solar:bolt-bold-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer'],
  showInMenu: false,
  title: 'Fast Scanner',
});

const route = useRoute();
const { $galantisApi } = useNuxtApp();

// Core state
const selectedDatetime = ref('');
const isLoading = ref(true);
const scannerSettings = ref<ScannerSettings | null>(null);
const scanHistory = ref<ScanHistoryItem[]>([]);
const unifiedInput = ref('');
const isProcessing = ref(false);
const scannerMode = ref<ScannerMode>('lookup');
const isSearching = ref(false);
const lookupResult = ref<RegistrationData | null>(null);
const searchResults = ref<RegistrationData[]>([]);

// UI state
const isScannerOpen = ref(false);
const showClearConfirmDialog = ref(false);
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => !breakpoints.md.value);

// Scanner ref
const TicketScannerRef = ref<InstanceType<typeof TicketScanner> | null>(null);
const inputRef = ref<HTMLInputElement>();

// Computed values
const eventId = computed(() => {
  if (!route?.params?.eventId)
    return '';
  return route.params.eventId as string;
});
const canScan = computed(() => !!selectedDatetime.value && !!scannerSettings.value);
const recentScans = computed(() => scanHistory.value.slice(0, 10));
const successfulScans = computed(() => scanHistory.value.filter(scan => scan.status === 'success').length);
const failedScans = computed(() => scanHistory.value.filter(scan => scan.status === 'error').length);

// Auto-focus input management
const focusInput = () => {
  nextTick(() => {
    if (inputRef.value && typeof inputRef.value.focus === 'function') {
      inputRef.value.focus();
    }
  });
};

// Scanner mode configuration
const modeConfig = computed(() => ({
  lookup: {
    capability: 'lookup',
    color: 'blue',
    description: 'View details',
    icon: 'heroicons:qr-code',
    title: 'Lookup',
  },
  continuous: {
    capability: 'continuous_scan',
    color: 'orange',
    description: 'Auto check-in',
    icon: 'heroicons:bolt',
    title: 'Continuous',
  },
  search: {
    capability: 'search',
    color: 'green',
    description: 'Search attendees',
    icon: 'heroicons:magnifying-glass',
    title: 'Search',
  },
}));

const availableModes = computed(() => {
  if (!scannerSettings.value?.capabilities)
    return [];

  const capabilities = scannerSettings.value.capabilities;

  return Object.entries(modeConfig.value)
    .filter(([_key, config]) => {
      const requiredCapability = config.capability as keyof typeof capabilities;
      return capabilities[requiredCapability] ?? false;
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

    if (!eventId.value) {
      throw new Error('Event ID not found in route params');
    }

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
    }
    else {
      throw new Error('Invalid response format from scanner API');
    }
  }
  catch (error: unknown) {
    console.error('Failed to load scanner settings:', error);
    const apiError = error as ApiError;

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
    }

    toast.error('Scanner Error', {
      description: errorMessage,
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
      const registrationData = response.data.data as RegistrationData;
      lookupResult.value = registrationData;

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

      toast.success(`${action} Successful ✅`, {
        description: `${registrationData?.attendee?.fullname || 'Attendee'} ${action} completed`,
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
        unifiedInput.value = '';
        focusInput();
        break;
      case 'continuous':
        await performCheckin(unifiedInput.value.trim(), 'checkin');
        unifiedInput.value = '';
        focusInput();
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
      limit: 10, // Reduced for fast display
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
}, 300);

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
      const registrationData = response.data.data as RegistrationData;

      // Add to scan history
      const scanEntry: ScanHistoryItem = {
        attendeeName: registrationData?.attendee?.fullname,
        code: result.rawValue,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Registration found',
        registrationData,
        status: 'lookup',
        timestamp: Date.now(),
      };
      scanHistory.value.unshift(scanEntry);

      lookupResult.value = registrationData;

      // Play success beep
      TicketScannerRef.value?.playSuccessBeep();

      // Handle continuous mode
      if (scannerMode.value === 'continuous') {
        if (registrationData.can_checkin) {
          await handleRegistrationAction(registrationData, 'checkin');
        }
        else if (registrationData.can_checkout) {
          await handleRegistrationAction(registrationData, 'checkout');
        }

        // Resume scanning after action
        setTimeout(() => {
          if (TicketScannerRef.value) {
            TicketScannerRef.value.resumeScanning();
          }
        }, 1000);
      }
    }
    else {
      throw new Error(response.data.message || 'Registration not found');
    }
  }
  catch (error: unknown) {
    const apiError = error as ApiError;
    TicketScannerRef.value?.playErrorBeep();
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
  toast.error('Scan Error ⚠️', { description: message });
};

const handleScannerError = (error: string) => {
  // Play error beep for camera/scanner errors
  TicketScannerRef.value?.playErrorBeep();

  toast.error('Scanner Error', {
    description: error,
  });
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

      // Update lookup result
      if (lookupResult.value?.id === registration.id) {
        lookupResult.value = updatedRegistration;
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
        description: `${updatedRegistration?.attendee?.fullname || 'Attendee'} ${action} completed${note ? ' (with note)' : ''}`,
        duration: isVip ? 6000 : 3000,
      });

      // Focus back to input for next scan
      focusInput();

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

const clearHistory = () => {
  scanHistory.value = [];
  showClearConfirmDialog.value = false;
  toast.success('History Cleared', {
    description: 'Scan history has been cleared',
  });
};

const exportHistory = () => {
  if (scanHistory.value.length === 0)
    return;

  const data = scanHistory.value.map(scan => ({
    timestamp: new Date(scan.timestamp).toLocaleString(),
    code: scan.code,
    status: scan.status,
    message: scan.message || '',
    attendee: scan.attendeeName || '',
    action: scan.action || '',
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
  a.download = `fast-scanner-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const codeFormat = computed((): SupportedBarcodeFormat[] => {
  return ['qr_code', 'code_128', 'code_39', 'ean_13'];
});

// Watch for mode changes
watch(() => scannerMode.value, (newMode) => {
  if (newMode === 'search') {
    if (unifiedInput.value.trim()) {
      debouncedSearch(unifiedInput.value);
    }
  }
  else {
    searchResults.value = [];
  }
  focusInput();
});

// Watch for input changes in search mode
watch(() => unifiedInput.value, (newValue) => {
  if (scannerMode.value === 'search') {
    debouncedSearch(newValue);
  }
});

// Auto-focus input when component mounts
onMounted(() => {
  loadScannerSettings();
  focusInput();

  // Global click handler to maintain focus
  const handleGlobalClick = () => {
    if (!isScannerOpen.value) {
      setTimeout(focusInput, 100);
    }
  };

  document.addEventListener('click', handleGlobalClick);

  onUnmounted(() => {
    document.removeEventListener('click', handleGlobalClick);
  });
});

useHead({
  title: 'Fast Scanner',
});
</script>

<template>
  <div class="container mx-auto max-w-6xl">
    <!-- Compact Header -->
    <div class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="flex items-center justify-between gap-4 p-4">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold">
            Fast Scanner
          </h1>

          <!-- Stats (Compact) -->
          <div v-if="!isLoading && scanHistory.length > 0" class="flex items-center gap-2 text-sm">
            <Badge variant="secondary" class="bg-green-50 text-green-700">
              ✓ {{ successfulScans }}
            </Badge>
            <Badge variant="secondary" class="bg-red-50 text-red-700">
              ✗ {{ failedScans }}
            </Badge>
          </div>
        </div>

        <!-- Session Select (Compact) -->
        <div v-if="!isLoading && scannerSettings" class="flex items-center gap-2">
          <Select v-model="selectedDatetime">
            <SelectTrigger class="w-64">
              <SelectValue placeholder="Select session..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="datetime in scannerSettings.datetimes" :key="datetime.id" :value="datetime.id">
                {{ datetime.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <div class="text-center">
        <div class="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p class="text-muted-foreground">
          Loading scanner...
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="scannerSettings" class="flex h-[calc(100vh-80px)] flex-col gap-4 p-4">
      <!-- Input Bar (Always Visible) -->
      <Card v-if="selectedDatetime" class="border-primary/20 bg-primary/5">
        <CardContent class="p-4">
          <div class="flex items-center gap-3">
            <!-- Mode Selector -->
            <Select v-model="scannerMode">
              <SelectTrigger class="h-14 max-w-lg shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="mode in availableModes" :key="mode.value" :value="mode.value">
                  <div class="flex items-center gap-2">
                    <Icon :icon="mode.icon" class="size-4" />
                    {{ mode.label }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Main Input -->
            <Input
              ref="inputRef"
              v-model="unifiedInput"
              :placeholder="scannerMode === 'search' ? 'Search by name, email, or code...' : 'Scan or enter code...'"
              class="h-14 flex-1 tracking-wider"
              autocomplete="off"
              @keydown.enter="handleUnifiedAction"
            />

            <!-- Camera Button -->
            <Button
              v-if="canScan"
              :variant="isScannerOpen ? 'destructive' : 'default'"
              @click="isScannerOpen = !isScannerOpen"
            >
              <Icon :icon="isScannerOpen ? 'heroicons:x-mark' : 'heroicons:camera'" class="mr-2 size-4" />
              {{ isScannerOpen ? 'Close' : 'Camera' }}
            </Button>

            <!-- Processing Indicator -->
            <div v-if="isProcessing || isSearching" class="flex items-center gap-2 text-sm text-muted-foreground">
              <div class="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {{ isProcessing ? 'Processing...' : 'Searching...' }}
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Main Content Area -->
      <div class="flex flex-1 gap-4">
        <!-- Results Column -->
        <div class="flex flex-1 flex-col gap-4 overflow-hidden">
          <!-- Search Results (Compact List) -->
          <Card v-if="scannerMode === 'search' && searchResults.length > 0" class="shrink-0">
            <CardContent class="max-h-64 overflow-y-auto p-4">
              <div class="space-y-2">
                <button
                  v-for="result in searchResults.slice(0, 8)"
                  :key="result.id"
                  class="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50"
                  @click="lookupResult = result"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ result.attendee.fullname }}</span>
                      <Badge v-if="result.special_attendee?.is_vip" class="bg-amber-500 text-white">
                        VIP
                      </Badge>
                    </div>
                    <p class="text-sm text-muted-foreground">
                      {{ result.attendee.email }}
                    </p>
                  </div>
                  <Badge :variant="result.checkin_status === 1 ? 'default' : 'secondary'">
                    {{ result.checkin_status === 1 ? 'Checked In' : 'Not Checked In' }}
                  </Badge>
                </button>
              </div>
            </CardContent>
          </Card>

          <!-- Lookup Result (Fast Actions) -->
          <LookupResult
            v-if="lookupResult"
            :lookup-result="lookupResult"
            :scanner-mode="scannerMode"
            :is-mobile="false"
            @registration-action="handleRegistrationAction"
            @continue-scanning="focusInput"
            @close-result="lookupResult = null; focusInput();"
          />

          <!-- Scan History (Compact) -->
          <div v-if="scanHistory.length > 0" class="flex-1 overflow-hidden">
            <ScanHistory
              :scan-history="scanHistory"
              :recent-scans="recentScans"
              :successful-scans="successfulScans"
              :failed-scans="failedScans"
              @export-history="exportHistory"
              @clear-history="showClearConfirmDialog = true"
              @registration-action="handleRegistrationAction"
            />
          </div>
        </div>

        <!-- Camera Column (Desktop) -->
        <div v-if="!isMobile && isScannerOpen" class="w-80 shrink-0">
          <Card class="h-full">
            <CardContent class="flex h-full flex-col p-4">
              <div class="mb-4">
                <h3 class="font-semibold">
                  Camera Scanner
                </h3>
                <p class="text-sm text-muted-foreground">
                  Point camera at barcode
                </p>
              </div>

              <div class="flex-1">
                <TicketScanner
                  ref="TicketScannerRef"
                  :formats="codeFormat"
                  :auto-resume="scannerMode === 'continuous'"
                  @detect="handleScanResult"
                  @error="handleScannerError"
                />
              </div>

              <div class="mt-4 space-y-2">
                <Button
                  v-if="!TicketScannerRef?.isScanning && !isProcessing"
                  class="w-full"
                  @click="TicketScannerRef?.resumeScanning()"
                >
                  Resume Scanning
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Mobile Scanner Sheet -->
    <Sheet v-if="isMobile && isScannerOpen" v-model:open="isScannerOpen">
      <SheetContent side="bottom" class="h-[70vh]">
        <SheetHeader>
          <SheetTitle>Camera Scanner</SheetTitle>
          <SheetDescription>Point the camera at a barcode or QR code</SheetDescription>
        </SheetHeader>

        <div class="flex h-[50vh] items-center justify-center">
          <TicketScanner
            ref="TicketScannerRef"
            :formats="codeFormat"
            :auto-resume="scannerMode === 'continuous'"
            @detect="handleScanResult"
            @error="handleScannerError"
          />
        </div>

        <SheetFooter>
          <Button variant="outline" class="w-full" @click="isScannerOpen = false">
            Close Camera
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <!-- Clear History Dialog -->
    <Dialog v-model:open="showClearConfirmDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clear Scan History</DialogTitle>
          <DialogDescription>
            Are you sure you want to clear all {{ scanHistory.length }} scan history entries?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
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
  </div>
</template>
