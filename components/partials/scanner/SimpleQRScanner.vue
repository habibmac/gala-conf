<script setup lang="ts">
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

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
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
  detect: [result: { rawValue: string, format: string, timestamp: number }]
  error: [error: string]
}>();

const isLoading = ref(true);
const lastScanTime = ref(0);
const scanCooldown = 1500; // Increased cooldown
const isScanning = ref(true); // Track scanning state
const qrcodeStreamRef = ref<InstanceType<typeof QrcodeStream> | null>(null);

// Audio methods
const playSuccessBeep = () => {
  if (!props.enableSound)
    return;

  try {
    // Create a simple beep using Web Audio API
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
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
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }
  catch (error) {
    console.warn('Could not play success beep:', error);
  }
};

const playErrorBeep = () => {
  if (!props.enableSound)
    return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported');
      return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime); // Lower beep for error
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }
  catch (error) {
    console.warn('Could not play error beep:', error);
  }
};

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
  // console.log('🔍 Raw detection:', code);

  if (code?.rawValue) {
    lastScanTime.value = now;

    playSuccessBeep();

    // Temporarily pause scanning to prevent rapid fire
    isScanning.value = false;

    emit('detect', {
      format: code.format || 'unknown',
      rawValue: code.rawValue,
      timestamp: now,
    });

    // Resume scanning after a short delay for continuous mode
    if (props.continuous) {
      setTimeout(() => {
        isScanning.value = true;
        // console.log('🔄 Scanning resumed');
      }, scanCooldown);
    }
  }
};

// Add method to manually resume scanning
const resumeScanning = () => {
  isScanning.value = true;
  // console.log('🔄 Manually resumed scanning');
};

// Expose resume method to parent
defineExpose({
  playErrorBeep,
  playSuccessBeep,
  resumeScanning,
});

const handleError = (error: unknown) => {
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

  emit('error', errorMessage);
};

const handleInit = async () => {
  await nextTick();
  isLoading.value = false;
  isScanning.value = true;
  // console.log('✅ Scanner initialized successfully');
};

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
  <div class="relative">
    <QrcodeStream
      ref="qrcodeStreamRef"
      :formats="['qr_code', 'code_128', 'code_39', 'ean_13']"
      :track="handleDetect"
      class="h-64 w-full overflow-hidden rounded-lg"
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

      <!-- Scanner overlay with status indicator -->

      <div class="scanner-overlay">
        <div class="crosshair">
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
.scanner-container {
  position: relative;
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #000;
}

.qr-camera {
  width: 100%;
  display: block;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

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
