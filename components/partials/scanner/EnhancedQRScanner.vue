<template>
  <div class="enhanced-qr-scanner">
    <!-- Scanner Controls -->
    <div class="flex gap-2 mb-4">
      <Button @click="toggleScanner" :disabled="isInitializing">
        <Icon 
          :icon="scannerActive ? 'heroicons:x-mark' : 'heroicons:camera'" 
          class="w-4 h-4 mr-2" 
        />
        {{ isInitializing ? 'Initializing...' : (scannerActive ? 'Stop Scanner' : 'Start Scanner') }}
      </Button>
      
      <Button 
        v-if="scannerPaused" 
        @click="resumeScanner" 
        variant="outline"
        class="animate-pulse"
      >
        <Icon icon="heroicons:play" class="w-4 h-4 mr-2" />
        Continue Scanning
      </Button>

      <Button 
        v-if="scannerActive && !scannerPaused"
        @click="pauseScanner"
        variant="outline"
      >
        <Icon icon="heroicons:pause" class="w-4 h-4 mr-2" />
        Pause
      </Button>
    </div>

    <!-- Scanner Container -->
    <div 
      v-show="scannerActive"
      class="scanner-container relative bg-black rounded-lg overflow-hidden"
    >
      <!-- QR Code Scanner -->
      <QrcodeStream 
        v-if="!scannerPaused"
        @detect="handleScanSuccess"
        @error="handleScanError"
        @camera-on="handleCameraOn"
        @camera-off="handleCameraOff"
        :formats="formats"
        :track="trackFunction"
        class="qr-scanner"
      />

      <!-- Paused State -->
      <div 
        v-if="scannerPaused" 
        class="paused-overlay flex items-center justify-center bg-black/80 text-white text-center p-8"
      >
        <div>
          <Icon icon="heroicons:pause-circle" class="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 class="text-lg font-semibold mb-2">Scanner Paused</h3>
          <p class="text-sm text-gray-300 mb-4">Last scan: {{ lastScanValue || 'None' }}</p>
          <Button @click="resumeScanner" class="bg-primary hover:bg-primary/80">
            <Icon icon="heroicons:play" class="w-4 h-4 mr-2" />
            Resume Scanning
          </Button>
        </div>
      </div>

      <!-- Crosshair and Guidance Overlay -->
      <div class="scanner-overlay">
        <!-- Crosshair with corners -->
        <div class="crosshair-container">
          <div class="crosshair-frame">
            <!-- Corner indicators -->
            <div class="corner corner-tl"></div>
            <div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div>
            <div class="corner corner-br"></div>
            
            <!-- Center crosshair -->
            <div class="center-crosshair">
              <div class="crosshair-line horizontal"></div>
              <div class="crosshair-line vertical"></div>
            </div>
          </div>
        </div>

        <!-- Guidance Text -->
        <div class="guidance-overlay">
          <div class="guidance-top">
            <p class="guidance-text">{{ guidanceText }}</p>
          </div>
          <div class="guidance-bottom">
            <div class="scan-status" :class="scanStatusClass">
              <Icon :icon="scanStatusIcon" class="w-5 h-5" />
              <span class="ml-2">{{ scanStatusText }}</span>
            </div>
          </div>
        </div>

        <!-- Success Animation -->
        <div v-if="showSuccessAnimation" class="success-animation">
          <div class="success-checkmark">
            <Icon icon="heroicons:check-circle" class="w-24 h-24 text-green-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Manual Input Fallback -->
    <div class="mt-4">
      <div class="flex gap-2">
        <Input 
          ref="manualInputRef"
          v-model="manualInput"
          :placeholder="inputPlaceholder"
          class="flex-1"
          @keyup.enter="processManualInput"
          @input="onManualInput"
        />
        <Button @click="processManualInput" :disabled="!manualInput.trim()">
          <Icon icon="heroicons:magnifying-glass" class="w-4 h-4 mr-2" />
          Process
        </Button>
      </div>
    </div>

    <!-- Debug Info -->
    <div v-if="showDebug" class="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
      <div class="grid grid-cols-2 gap-2">
        <div><strong>Scanner Status:</strong> {{ scannerStatus }}</div>
        <div><strong>Last Scan:</strong> {{ lastScanTime || 'None' }}</div>
        <div><strong>Scans Count:</strong> {{ scanCount }}</div>
        <div><strong>Camera Active:</strong> {{ cameraActive ? 'Yes' : 'No' }}</div>
      </div>
      <div v-if="lastError" class="mt-2 text-red-600">
        <strong>Last Error:</strong> {{ lastError }}
      </div>
      <div v-if="lastScanValue" class="mt-2 text-green-600">
        <strong>Last Value:</strong> {{ lastScanValue }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/vue';

// Props
interface Props {
  formats?: string[];
  continuous?: boolean;
  showDebug?: boolean;
  inputPlaceholder?: string;
  autoFocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  formats: () => ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'],
  continuous: true,
  showDebug: false,
  inputPlaceholder: 'Scan or enter barcode here...',
  autoFocus: true,
});

// Emits
const emit = defineEmits<{
  detect: [result: { rawValue: string; format: string; timestamp: number }];
  error: [error: string];
  started: [];
  stopped: [];
  input: [value: string];
}>();

// Reactive state
const scannerActive = ref(false);
const scannerPaused = ref(false);
const isInitializing = ref(false);
const cameraActive = ref(false);
const scannerStatus = ref('inactive');
const lastScanTime = ref<string>('');
const lastError = ref<string>('');
const lastScanValue = ref<string>('');
const scanCount = ref(0);
const showSuccessAnimation = ref(false);
const manualInput = ref('');
const manualInputRef = ref<HTMLInputElement>();

// Guidance and status
const guidanceText = computed(() => {
  if (scannerPaused.value) return 'Scanner paused - click continue to resume';
  if (!cameraActive.value) return 'Initializing camera...';
  return 'Position the QR code or barcode within the frame';
});

const scanStatusText = computed(() => {
  if (scannerPaused.value) return 'Paused';
  if (!cameraActive.value) return 'Starting...';
  return 'Scanning...';
});

const scanStatusIcon = computed(() => {
  if (scannerPaused.value) return 'heroicons:pause-circle';
  if (!cameraActive.value) return 'heroicons:camera';
  return 'heroicons:viewfinder-circle';
});

const scanStatusClass = computed(() => {
  if (scannerPaused.value) return 'text-yellow-400';
  if (!cameraActive.value) return 'text-blue-400';
  return 'text-green-400 animate-pulse';
});

// Track function for visual feedback
const trackFunction = (detectedCodes: any[], ctx: CanvasRenderingContext2D) => {
  if (detectedCodes.length === 0) return;

  const code = detectedCodes[0];
  const { boundingBox, cornerPoints } = code;

  // Draw bounding box
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 3;
  ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);

  // Draw corner points
  if (cornerPoints && cornerPoints.length === 4) {
    ctx.fillStyle = '#00ff00';
    cornerPoints.forEach((point: any) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw connecting lines
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cornerPoints[0].x, cornerPoints[0].y);
    for (let i = 1; i < cornerPoints.length; i++) {
      ctx.lineTo(cornerPoints[i].x, cornerPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
};

// Scanner event handlers
const handleScanSuccess = async (detectedCodes: any[]) => {
  if (detectedCodes.length === 0 || scannerPaused.value) return;

  const code = detectedCodes[0];
  const decodedText = code.rawValue;

  console.log('🎯 QR Code detected:', {
    value: decodedText,
    format: code.format,
    boundingBox: code.boundingBox
  });

  // Update state
  scanCount.value++;
  lastScanTime.value = new Date().toLocaleTimeString();
  lastScanValue.value = decodedText;
  lastError.value = '';

  // Set value in manual input
  manualInput.value = decodedText;

  // Show success animation
  showSuccessAnimation.value = true;
  setTimeout(() => {
    showSuccessAnimation.value = false;
  }, 1000);

  // Play success beep
  playBeep();

  // Create result object
  const result = {
    rawValue: decodedText,
    format: code.format || 'unknown',
    timestamp: Date.now()
  };

  // Emit events
  emit('detect', result);
  emit('input', decodedText);

  // Pause scanner if not in continuous mode
  if (!props.continuous) {
    await pauseScanner();
  }
};

const handleScanError = (error: Error) => {
  console.error('❌ Scanner error:', error);
  lastError.value = error.message;
  emit('error', error.message);
};

const handleCameraOn = () => {
  cameraActive.value = true;
  scannerStatus.value = 'active';
  emit('started');
  console.log('📷 Camera started');
};

const handleCameraOff = () => {
  cameraActive.value = false;
  scannerStatus.value = 'inactive';
  emit('stopped');
  console.log('📷 Camera stopped');
};

// Scanner control functions
const toggleScanner = async () => {
  if (!scannerActive.value) {
    await startScanner();
  } else {
    await stopScanner();
  }
};

const startScanner = async () => {
  if (scannerActive.value) return;

  try {
    isInitializing.value = true;
    scannerStatus.value = 'initializing';
    lastError.value = '';

    scannerActive.value = true;
    scannerPaused.value = false;

    console.log('✅ Starting scanner...');

  } catch (error: any) {
    console.error('❌ Scanner start error:', error);
    lastError.value = error.message || 'Failed to start scanner';
    scannerStatus.value = 'error';
    emit('error', lastError.value);
  } finally {
    isInitializing.value = false;
  }
};

const stopScanner = async () => {
  if (!scannerActive.value) return;

  try {
    scannerActive.value = false;
    scannerPaused.value = false;
    cameraActive.value = false;
    scannerStatus.value = 'inactive';

    console.log('🛑 Scanner stopped');

  } catch (error: any) {
    console.error('❌ Scanner stop error:', error);
    lastError.value = error.message || 'Failed to stop scanner';
  }
};

const pauseScanner = async () => {
  if (!scannerActive.value || scannerPaused.value) return;

  try {
    scannerPaused.value = true;
    scannerStatus.value = 'paused';
    console.log('⏸️ Scanner paused');
  } catch (error: any) {
    console.error('❌ Scanner pause error:', error);
  }
};

const resumeScanner = async () => {
  if (!scannerActive.value || !scannerPaused.value) return;

  try {
    scannerPaused.value = false;
    scannerStatus.value = 'active';
    console.log('▶️ Scanner resumed');
  } catch (error: any) {
    console.error('❌ Scanner resume error:', error);
  }
};

// Manual input handlers
const onManualInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('input', target.value);
};

const processManualInput = () => {
  if (!manualInput.value.trim()) return;

  const result = {
    rawValue: manualInput.value.trim(),
    format: 'manual',
    timestamp: Date.now()
  };

  console.log('⌨️ Manual input processed:', result);
  
  lastScanValue.value = result.rawValue;
  scanCount.value++;
  lastScanTime.value = new Date().toLocaleTimeString();

  emit('detect', result);
  playBeep();

  // Clear input
  manualInput.value = '';
};

// Beep function (from your vanilla implementation)
const playBeep = (freq = 660, duration = 90, vol = 50) => {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(1, context.currentTime + 0.002);
    
    oscillator.connect(gain);
    oscillator.frequency.value = freq;
    oscillator.type = "square";
    gain.connect(context.destination);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration * 0.001);
    
    oscillator.onended = () => context.close();
  } catch (error) {
    console.warn('Could not play beep sound:', error);
  }
};

// Auto-focus input when needed
watch([scannerActive, props], async () => {
  if (!scannerActive.value && props.autoFocus) {
    await nextTick();
    manualInputRef.value?.focus();
  }
});

// Expose methods
defineExpose({
  startScanner,
  stopScanner,
  pauseScanner,
  resumeScanner,
  toggleScanner,
  getValue: () => manualInput.value,
  setValue: (value: string) => {
    manualInput.value = value;
  },
  focus: () => manualInputRef.value?.focus(),
});
</script>

<style scoped>
.scanner-container {
  position: relative;
  max-width: 100%;
  margin: 0 auto;
  min-height: 300px;
}

.qr-scanner {
  width: 100%;
  border-radius: 0.5rem;
}

.paused-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0.5rem;
  z-index: 10;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
}

.crosshair-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-frame {
  position: relative;
  width: 250px;
  height: 250px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 3px solid #10b981;
}

.corner-tl {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 12px;
}

.corner-tr {
  top: -3px;
  right: -3px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 12px;
}

.corner-bl {
  bottom: -3px;
  left: -3px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 12px;
}

.corner-br {
  bottom: -3px;
  right: -3px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 12px;
}

.center-crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-line {
  background: #10b981;
  position: absolute;
}

.crosshair-line.horizontal {
  width: 30px;
  height: 2px;
  top: -1px;
  left: -15px;
}

.crosshair-line.vertical {
  width: 2px;
  height: 30px;
  top: -15px;
  left: -1px;
}

.guidance-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
}

.guidance-top {
  text-align: center;
}

.guidance-text {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
}

.guidance-bottom {
  display: flex;
  justify-content: center;
}

.scan-status {
  background: rgba(0, 0, 0, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
}

.success-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: successPulse 1s ease-in-out;
}

@keyframes successPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* Override vue-qrcode-reader styles */
:deep(.qrcode-stream-camera) {
  border-radius: 0.5rem;
}

:deep(.qrcode-stream-wrapper) {
  border-radius: 0.5rem;
  overflow: hidden;
}
</style>