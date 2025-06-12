<script setup lang="ts">
import type { BarcodeFormat } from 'vue-qrcode-reader';

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
  formats?: BarcodeFormat[]
  continuous?: boolean
  facingMode?: 'user' | 'environment'
  enableSound?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  continuous: true,
  enableSound: true,
  facingMode: 'environment',
  formats: (): BarcodeFormat[] => ['qr_code', 'code_128', 'code_39', 'ean_13'], // Add type annotation
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
const scanCooldown = 1500; // Cooldown time in milliseconds
const isScanning = ref(true); // Track scanning state
const isError = ref(false);
const errMessage = ref<string | null>(null);
const qrcodeStreamRef = ref<InstanceType<typeof QrcodeStream> | null>(null);

const showResult = ref(false);
const scanResult = ref<any>(null);
const scanningMessage = ref('Ready...');

// Key fix: Reset scanning state after each detection
const handleDetect = async (detectedCodes: DetectedCode[]) => {
  if (!detectedCodes?.length || !isScanning.value)
    return;

  const now = Date.now();

  // Pause scanning immediately
  isScanning.value = false;
  // Prevent rapid duplicate scans
  if (now - lastScanTime.value < scanCooldown) {
    return;
  }

  const code = detectedCodes[0];

  if (code?.rawValue) {
    lastScanTime.value = now;

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
  scanningMessage.value = 'Ready...';
};

const playSuccessBeep = () => {
  try {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported');
      return;
    }
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // High beep
    // Increased from 0.3 to 0.6 for more volume while keeping softness
    gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }
  catch (error) {
    console.warn('Could not play success beep:', error);
  }
};

const playErrorBeep = () => {
  try {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported');
      return;
    }
    const context = new AudioContextClass();

    // Create a more moderate error sound
    const times = [0, 0.15]; // 3 quick beeps
    const frequencies = [100, 60]; // Low-high-low pattern

    times.forEach((startTime, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      // Use square wave but reduce volume
      oscillator.type = 'square';
      oscillator.frequency.value = frequencies[index];

      // Reduced volume from 1.0 to 0.5 for less harshness
      gain.gain.setValueAtTime(0, context.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.5, context.currentTime + startTime + 0.002); // Quick attack but lower peak
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + startTime + 0.12); // Quick decay

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(context.currentTime + startTime);
      oscillator.stop(context.currentTime + startTime + 0.12);
    });

    // Close context after all beeps finish
    setTimeout(() => context.close(), 600);
  }
  catch (error) {
    console.warn('Could not play error beep:', error);
  }
};

// Expose resume method to parent
defineExpose({
  resumeScanning,
  showScanResult,
  playSuccessBeep,
  playErrorBeep,
  isScanning,
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
      :formats="formats"
      :track="handleDetect"
      :paused="!isScanning"
      class="aspect-square size-40 overflow-hidden rounded-lg"
      @detect="handleDetect"
      @error="handleError"
      @camera-on="handleInit"
    >
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
      >
        <div class="text-center">
          <Icon
            icon="svg-spinners:ring-resize"
            class="mx-auto mb-2 size-8"
          />
          <p class="text-sm text-muted-foreground">
            Starting camera...
          </p>
        </div>
      </div>

      <div v-else-if="isError">
        <div class="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-800/40">
          <div class="max-w-40 space-y-2 text-center">
            <Icon
              icon="mdi:alert-circle"
              class="mx-auto mb-2 size-8 text-red-600"
            />
            <p class="text-sm text-red-600 dark:text-red-400">
              {{ errMessage }}
            </p>
            <Button
              variant="destructive"
              @click="resumeScanning"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>

      <!-- Resume button -->
      <div
        v-else-if="showResult"
        class="absolute inset-0 flex items-end justify-center"
      >
        <div class="mb-10 space-y-2 text-center">
          <Button @click="resumeScanning">
            Continue Scanning
          </Button>
        </div>
      </div>

      <!-- Scan result display -->
      <slot
        v-if="showResult"
        name="result"
        :result="scanResult"
        @close="resumeScanning"
        @save-note="$emit('save-note', $event)"
      />

      <!-- Scanning message -->
      <div
        v-if="!isLoading && !isError && !showResult"
        class="absolute inset-0 flex items-end justify-center"
      >
        <p class="mb-24 text-sm text-muted">
          {{ scanningMessage }}
        </p>
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
