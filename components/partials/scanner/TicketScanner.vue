<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { nextTick, ref, watch } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';

interface DetectedCode {
  rawValue: string
  format?: string
  cornerPoints?: Array<{ x: number, y: number }>
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface Props {
  formats?: string[]
  continuous?: boolean
  facingMode?: 'user' | 'environment'
  enableSound?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  continuous: true,
  enableSound: true,
  facingMode: 'environment',
  formats: () => ['qr_code', 'code_128', 'code_39', 'ean_13'],
});

const emit = defineEmits<{
  'detect': [result: { rawValue: string, format: string, timestamp: number }]
  'error': [error: string]
  'checkin': [registration: any]
  'checkout': [registration: any]
  'result': [result: any]
  'save-note': [data: { registration: any, note: string }]
}>();

const isLoading = ref(true);
const lastScanTime = ref(0);
const scanCooldown = 1500; // Increased cooldown
const isScanning = ref(true); // Track scanning state
const isError = ref(false);
const errMessage = ref<string | null>(null);
const qrcodeStreamRef = ref<InstanceType<typeof QrcodeStream> | null>(null);

const showResult = ref(false);
const scanResult = ref<any>(null);
const scanningMessage = ref('Point camera at barcode or QR code');
const quickNote = ref('');
const noteSuggestions = ref([
  'VIP guest',
  'Wheelchair access',
  'Dietary restriction',
  'Group leader',
  'Late arrival',
  'Special assistance',
  'Media/Press',
  'Vendor',
]);

// Key fix: Reset scanning state after each detection
const handleDetect = async (detectedCodes: DetectedCode[]) => {
  if (!detectedCodes?.length || !isScanning.value)
    return;

  const now = Date.now();

  // Prevent rapid duplicate scans
  if (now - lastScanTime.value < scanCooldown) {
    return;
  }

  const code = detectedCodes[0];

  if (code?.rawValue) {
    lastScanTime.value = now;

    // Pause scanning immediately
    isScanning.value = false;
    scanningMessage.value = 'Processing...';

    emit('detect', {
      format: code.format || 'unknown',
      rawValue: code.rawValue,
      timestamp: now,
    });
  }
};

const handleError = (error: unknown) => {
  isLoading.value = false;
  console.error('Scanner error:', error);

  let errorMessage = 'Scanner error occurred';

  if (typeof error === 'object' && error !== null) {
    const err = error as { name?: string, message?: string };

    if (err.name === 'NotAllowedError') {
      errorMessage = 'Camera permission denied. Please allow camera access.';
    }
    else if (err.name === 'NotFoundError') {
      errorMessage = 'No camera found on this device.';
    }
    else if (err.name === 'NotSupportedError') {
      errorMessage = 'Camera not supported on this device.';
    }
    else if (err.name === 'NotReadableError') {
      errorMessage = 'Camera is already in use by another application.';
    }
    else if (err.message) {
      errorMessage = err.message;
    }
  }

  isError.value = true;
  errMessage.value = errorMessage;

  emit('error', errorMessage);
};

const handleInit = async () => {
  await nextTick();
  isLoading.value = false;
  isScanning.value = true;
  // console.log('✅ Scanner initialized successfully');
};

const handleCheckinWithNote = () => {
  emit('checkin', { registration: scanResult.value, note: quickNote.value });
  clearNote();
};

const handleCheckoutWithNote = () => {
  emit('checkout', { registration: scanResult.value, note: quickNote.value });
  clearNote();
};

const handleSaveNoteOnly = () => {
  emit('save-note', { registration: scanResult.value, note: quickNote.value });
  clearNote();
};

const handleQuickAction = () => {
  if (scanResult.value?.can_checkin && scanResult.value?.checkin_status !== 1) {
    handleCheckinWithNote();
  }
};

const showScanResult = (result: any) => {
  scanResult.value = result;
  showResult.value = true;
  scanningMessage.value = 'Scan completed';
};

// Update resumeScanning method
const resumeScanning = () => {
  showResult.value = false;
  scanResult.value = null;
  isScanning.value = true;
  scanningMessage.value = 'Point camera at barcode or QR code';
};

const clearNote = () => {
  quickNote.value = '';
};

// Expose resume method to parent
defineExpose({
  resumeScanning,
  showScanResult,
});

// Watch for changes in continuous prop
watch(
  () => props.continuous,
  (newVal) => {
    if (newVal) {
      isScanning.value = true;
    }
  },
);
</script>

<template>
  <div class="relative mt-5">
    <QrcodeStream
      ref="qrcodeStreamRef"
      :formats="['qr_code', 'code_128', 'code_39', 'ean_13']"
      :track="handleDetect"
      class="aspect-square size-full max-h-[40dvh] overflow-hidden rounded-lg"
      @detect="handleDetect"
      @error="handleError"
      @camera-on="handleInit"
    >
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div class="text-center">
          <Icon icon="svg-spinners:ring-resize" class="mx-auto mb-2 size-8" />
          <p class="text-sm text-muted-foreground">
            Starting camera...
          </p>
        </div>
      </div>

      <div v-else-if="isError">
        <div class="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-800/40">
          <div class="space-y-2 text-center">
            <Icon icon="mdi:alert-circle" class="mx-auto mb-2 size-8 text-red-600" />
            <p class="text-sm text-red-600 dark:text-red-400">
              {{ errMessage }}
            </p>
            <Button variant="destructive" @click="resumeScanning">
              Retry
            </Button>
          </div>
        </div>
      </div>

      <!-- Result Overlay -->
      <div v-if="showResult && scanResult" class="absolute inset-0 z-10 flex items-end justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-4 dark:bg-gray-900">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-semibold text-green-600">
              ✅ Scan Successful
            </h3>
            <button class="text-gray-400 hover:text-gray-600" @click="resumeScanning">
              <Icon icon="heroicons:x-mark" class="size-5" />
            </button>
          </div>

          <div class="mb-3 space-y-2 text-sm">
            <div><strong>Name:</strong> {{ scanResult.attendee?.full_name }}</div>
            <div><strong>Code:</strong> {{ scanResult.code }}</div>
            <div>
              <strong>Status:</strong>
              <Badge :variant="scanResult.can_checkin ? 'default' : 'secondary'">
                {{ scanResult.checkin_status_text }}
              </Badge>
            </div>
          </div>

          <!-- Quick Notes Input -->
          <div class="mb-3">
            <div class="mb-1 flex items-center gap-2">
              <Icon icon="heroicons:pencil-square" class="size-4 text-muted-foreground" />
              <label class="text-xs font-medium text-muted-foreground">Quick Note (optional)</label>
            </div>
            <textarea
              v-model="quickNote"
              placeholder="e.g., VIP guest, wheelchair access, dietary restriction..."
              class="min-h-[60px] w-full resize-none rounded border px-2 py-1 text-sm"
              maxlength="200"
              @keydown.enter.ctrl="handleQuickAction"
              @keydown.enter.meta="handleQuickAction"
            />
            <div class="mt-1 text-xs text-muted-foreground">
              {{ quickNote.length }}/200 • Ctrl+Enter to quick check-in
            </div>
          </div>

          <!-- Quick Note Suggestions -->
          <div v-if="noteSuggestions.length > 0 && !quickNote" class="mb-3">
            <div class="mb-1 text-xs font-medium text-muted-foreground">
              Quick suggestions:
            </div>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="suggestion in noteSuggestions"
                :key="suggestion"
                class="rounded-full bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                @click="quickNote = suggestion"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <div class="flex gap-2">
            <Button
              v-if="scanResult.can_checkin && scanResult.checkin_status !== 1"
              size="sm"
              @click="handleCheckinWithNote"
            >
              <Icon icon="heroicons:arrow-right-end-on-rectangle" class="mr-1 size-3" />
              Check In{{ quickNote ? ' + Note' : '' }}
            </Button>
            <Button
              v-if="scanResult.can_checkout"
              size="sm"
              variant="destructive"
              @click="handleCheckoutWithNote"
            >
              <Icon icon="heroicons:arrow-left-start-on-rectangle" class="mr-1 size-3" />
              Check Out{{ quickNote ? ' + Note' : '' }}
            </Button>
            <Button
              v-if="quickNote"
              size="sm"
              variant="outline"
              @click="handleSaveNoteOnly"
            >
              Save Note Only
            </Button>
            <Button size="sm" variant="outline" @click="resumeScanning">
              Continue
            </Button>
          </div>
        </div>
      </div>

      <!-- Scanner overlay with status indicator -->
      <div class=" pointer-events-none absolute inset-0 flex items-center justify-center">
        <div class="crosshair aspects-square">
          <div class="corner corner-tl" />
          <div class="corner corner-tr" />
          <div class="corner corner-bl" />
          <div class="corner corner-br" />
        </div>
      </div>
    </QrcodeStream>
  </div>
</template>

<style scoped>
.crosshair {
  position: relative;
  width: min(60%, 300px);
  height: min(60%, 300px);
  max-width: 80vw;
  max-height: 40vh;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #fff;
}

.corner-tl {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

:deep(.qrcode-stream-camera) {
  width: 100%;
  height: auto;
}
</style>
