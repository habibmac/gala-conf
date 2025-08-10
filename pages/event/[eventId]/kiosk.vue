<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationData } from '~/types';

definePageMeta({
  capabilities: ['ee_read_checkins'],
  group: 'tools',
  icon: 'solar:monitor-smartphone-bold-duotone',
  layout: false, // Keep full-screen for kiosk mode
  packages: ['optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer'],
  showInMenu: true,
  title: 'Kiosk',
  order: 11,
  condition: (event: any) => {
    // Only show if allow_self_checkin is explicitly set to true
    return event?.allow_self_checkin === true;
  },
});

const route = useRoute();
const { $galantisApi } = useNuxtApp();

const eventId = computed(() => route.params.eventId as string);

// State
const isLoading = ref(true);
const event = ref<any>(null);
const scanInput = ref('');
const isProcessing = ref(false);
const scanResult = ref<RegistrationData | null>(null);
const showResult = ref(false);
const error = ref('');

// Auto-focus hidden input
const hiddenInputRef = ref<HTMLInputElement>();

// Welcome text mapping by event category
const welcomeTextMap: Record<string, string> = {
  sport: 'Selamat datang kepada para peserta',
  wedding: 'Selamat datang kepada para undangan',
  conference: 'Selamat datang kepada para peserta',
  default: 'Selamat datang kepada para tamu',
};

const welcomeText = computed(() => {
  const category = event.value?.category?.toLowerCase() || 'default';
  return welcomeTextMap[category] || welcomeTextMap.default;
});

// Dynamic styling based on event configuration
const backgroundStyle = computed(() => {
  const styles: Record<string, string> = {};

  if (event.value?.bg) {
    // Custom background image
    styles.backgroundImage = `url(${event.value.bg})`;
    styles.backgroundSize = 'cover';
    styles.backgroundPosition = 'center';
  }
  else if (event.value?.bg_color) {
    // Custom background color
    styles.backgroundColor = event.value.bg_color;
  }

  return styles;
});

const textColorStyle = computed(() => {
  if (event.value?.header_text_color) {
    return { color: event.value.header_text_color };
  }
  return { color: 'white' }; // Default
});

// Show all answers that have values (limited for kiosk display)
const getKeyAnswers = (answers: any[] | undefined) => {
  if (!answers) return [];
  
  return answers.filter((answer: any) => {
    return answer.ans && answer.ans !== '' && answer.ans !== '-';
  }).slice(0, 2); // Limit to 2 for kiosk display
};

// Load event data
const loadEventData = async () => {
  try {
    isLoading.value = true;
    const response = await $galantisApi.get(`/event/${eventId.value}`);
    event.value = response.data;

    // Check if self check-in is disabled for this event
    if (event.value?.allow_self_checkin === false) {
      error.value = 'Self check-in is not enabled for this event';
    }
  }
  catch (err) {
    console.error('Failed to load event data:', err);
    error.value = 'Failed to load event configuration';
    // Set fallback event data
    event.value = { title: 'Event Check-in', category: 'default' };
  }
  finally {
    isLoading.value = false;
  }
};

// Handle barcode scan
const handleScan = async () => {
  const code = scanInput.value.trim();
  if (!code || isProcessing.value)
    return;

  isProcessing.value = true;
  error.value = '';

  try {
    // First lookup the registration
    const lookupResponse = await $galantisApi.post(`/event/${eventId.value}/scanner/lookup`, {
      barcode: code,
      datetime_id: null, // Self check-in might not need specific datetime
    });

    if (lookupResponse.data.success) {
      const registration = lookupResponse.data.data as RegistrationData;

      // Try to check-in if possible
      if (registration.can_checkin) {
        const checkinResponse = await $galantisApi.post(`/event/${eventId.value}/scanner/checkin`, {
          barcode: code,
          action: 'checkin',
          check_approved: true,
          datetime_id: null,
        });

        if (checkinResponse.data.success) {
          scanResult.value = checkinResponse.data.registration as RegistrationData;
        }
        else {
          scanResult.value = registration;
        }
      }
      else {
        scanResult.value = registration;
      }

      showResult.value = true;

      // Auto-reset after delay (longer for VIP)
      const isVip = scanResult.value?.special_attendee?.is_vip;
      const delay = isVip ? 8000 : 5000;

      setTimeout(() => {
        resetToStandby();
      }, delay);
    }
    else {
      throw new Error(lookupResponse.data.message || 'Registration not found');
    }
  }
  catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Scan failed';

    // Auto-clear error after 3 seconds
    setTimeout(() => {
      resetToStandby();
    }, 3000);
  }
  finally {
    isProcessing.value = false;
  }
};

const resetToStandby = () => {
  scanInput.value = '';
  scanResult.value = null;
  showResult.value = false;
  error.value = '';

  // Refocus hidden input
  nextTick(() => {
    hiddenInputRef.value?.focus();
  });
};

// Watch for Enter key or scanner input completion
watch(() => scanInput.value, (newValue) => {
  // Barcode scanners typically append newline/enter
  if (newValue.includes('\n') || newValue.includes('\r')) {
    scanInput.value = newValue.replace(/[\n\r]/g, '');
    handleScan();
  }
});

// Auto-focus on mount and maintain focus
onMounted(() => {
  loadEventData();

  nextTick(() => {
    hiddenInputRef.value?.focus();
  });

  // Refocus when clicking anywhere
  const refocus = () => {
    if (!showResult.value) {
      hiddenInputRef.value?.focus();
    }
  };

  document.addEventListener('click', refocus);
  document.addEventListener('keydown', refocus);

  onUnmounted(() => {
    document.removeEventListener('click', refocus);
    document.removeEventListener('keydown', refocus);
  });
});

useHead({
  title: computed(() => `${event.value?.title || 'Event'} - Check-in`),
});
</script>

<template>
  <div
    class="relative min-h-screen w-full overflow-hidden"
    :class="!event?.bg && !event?.bg_color ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' : ''"
    :style="backgroundStyle"
  >
    <!-- Legacy Background Image (logo_url) - only if no custom bg -->
    <div
      v-if="event?.logo_url && !event?.bg"
      class="absolute inset-0 bg-cover bg-center opacity-20"
      :style="{ backgroundImage: `url(${event.logo_url})` }"
    />

    <!-- Background Overlay - darker for images, lighter for solid colors -->
    <div
      class="absolute inset-0"
      :class="event?.bg ? 'bg-black/40' : 'bg-black/30'"
    />

    <!-- Hidden Input for Scanner -->
    <input
      ref="hiddenInputRef"
      v-model="scanInput"
      type="text"
      class="sr-only"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      @keydown.enter="handleScan"
    >

    <!-- Content -->
    <div
      class="relative z-10 flex min-h-screen flex-col items-center justify-center p-8"
      :style="textColorStyle"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center">
        <div
          class="mx-auto mb-4 size-16 animate-spin rounded-full border-4 border-t-transparent"
          :style="{ borderColor: textColorStyle.color, borderTopColor: 'transparent' }"
        />
        <p class="text-xl">
          Loading...
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <div class="mb-6">
          <Icon icon="solar:close-circle-bold" class="mx-auto size-24 text-red-400" />
        </div>
        <h2 class="mb-4 text-3xl font-bold text-red-400">
          Error
        </h2>
        <p class="text-xl text-red-200">
          {{ error }}
        </p>
        <div class="mt-8 text-sm text-white/60">
          <Icon icon="solar:restart-bold" class="mr-2 size-4 animate-spin" />
          Returning to standby...
        </div>
      </div>

      <!-- Success State -->
      <div v-else-if="showResult && scanResult" class="text-center">
        <div class="mb-6">
          <Icon
            v-if="scanResult.special_attendee?.is_vip"
            icon="solar:crown-bold"
            class="mx-auto size-24 text-amber-400"
          />
          <Icon
            v-else
            icon="solar:check-circle-bold"
            class="mx-auto size-24 text-green-400"
          />
        </div>

        <h2
          class="mb-4 text-4xl font-bold"
          :class="scanResult.special_attendee?.is_vip ? 'text-amber-400' : 'text-green-400'"
        >
          <span v-if="scanResult.special_attendee?.is_vip">Welcome VIP!</span>
          <span v-else>{{ welcomeText }}</span>
        </h2>

        <div class="mb-6 space-y-2">
          <p class="text-2xl font-semibold">
            {{ scanResult.attendee.fullname }}
          </p>
          <p class="text-lg text-white/80">
            {{ scanResult.ticket.name }}
          </p>

          <!-- VIP Special Treatment -->
          <div v-if="scanResult.special_attendee?.special_treatment" class="mt-4">
            <div class="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 text-amber-200">
              <Icon icon="solar:medal-star-bold" class="size-5" />
              <span class="font-medium">Special Treatment Required</span>
            </div>
          </div>

          <!-- Staff Notes -->
          <div v-if="scanResult.special_attendee?.notes" class="mt-4">
            <div class="rounded-lg bg-blue-500/20 p-4 text-blue-100">
              <div class="flex items-start gap-2">
                <Icon icon="solar:note-bold" class="mt-0.5 size-5 shrink-0" />
                <div class="text-sm">
                  <div class="mb-1 font-medium">
                    Staff Note:
                  </div>
                  <div>{{ scanResult.special_attendee.notes }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Key Information -->
          <div v-if="getKeyAnswers(scanResult.ans).length > 0" class="mt-4">
            <div class="rounded-lg bg-green-500/20 p-4 text-green-100">
              <div class="flex items-start gap-2">
                <Icon icon="solar:info-circle-bold" class="mt-0.5 size-5 shrink-0" />
                <div class="text-sm">
                  <div class="mb-2 font-medium">Key Information:</div>
                  <div class="space-y-1">
                    <div 
                      v-for="keyAnswer in getKeyAnswers(scanResult.ans)" 
                      :key="keyAnswer.id"
                      class="flex justify-between"
                    >
                      <span class="font-medium">{{ keyAnswer.qst }}:</span>
                      <span>{{ keyAnswer.ans }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Check-in Status -->
        <div class="flex items-center justify-center gap-2 text-lg">
          <Icon
            v-if="scanResult.checkin_status === 1"
            icon="solar:check-circle-bold"
            class="size-6 text-green-400"
          />
          <span>{{ scanResult.checkin_status_text }}</span>
        </div>
      </div>

      <!-- Standby State -->
      <div v-else class="text-center">
        <!-- Event Logo -->
        <div v-if="event?.logo_url" class="mb-8">
          <img
            :src="event.logo_url"
            :alt="event.title"
            class="mx-auto h-32 w-auto object-contain"
          >
        </div>

        <h1 class="mb-8 text-5xl font-bold">
          {{ event?.title || 'Event Check-in' }}
        </h1>

        <div class="mb-12 space-y-4">
          <p class="text-2xl font-light opacity-90">
            {{ welcomeText }}
          </p>
          <p class="text-lg opacity-70">
            Silakan pindai barcode atau QR code tiket Anda
          </p>
        </div>

        <!-- Scanner Icon -->
        <div class="mb-8">
          <div
            class="mx-auto inline-flex items-center justify-center rounded-full p-6"
            :style="{ backgroundColor: `${textColorStyle.color}20` }"
          >
            <Icon icon="solar:qr-code-bold" class="size-16" :style="textColorStyle" />
          </div>
        </div>

        <!-- Processing Indicator -->
        <div v-if="isProcessing" class="flex items-center justify-center gap-2 text-lg">
          <Icon icon="solar:refresh-bold" class="size-6 animate-spin" />
          <span>Processing...</span>
        </div>

        <!-- Instructions -->
        <div class="mt-12 text-sm opacity-50">
          <p>Point your camera at the barcode or use a barcode scanner</p>
        </div>
      </div>
    </div>
  </div>
</template>
