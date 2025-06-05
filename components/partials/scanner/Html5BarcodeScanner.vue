<template>
  <div class="html5-barcode-scanner">
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
      >
        <Icon icon="heroicons:play" class="w-4 h-4 mr-2" />
        Continue Scanning
      </Button>
    </div>

    <!-- Scanner Container -->
    <div 
      v-show="scannerActive || scannerPaused"
      class="scanner-container bg-black rounded-lg overflow-hidden"
    >
      <div id="html5-qr-reader" class="w-full"></div>
      
      <!-- Scanning Overlay -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div class="w-64 h-64 border-2 border-white/30 rounded-lg relative">
            <!-- Corner indicators -->
            <div class="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
            <div class="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
            <div class="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
            <div class="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status and Debug Info -->
    <div v-if="showDebug" class="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
      <div class="grid grid-cols-2 gap-2">
        <div><strong>Scanner Status:</strong> {{ scannerStatus }}</div>
        <div><strong>Last Scan:</strong> {{ lastScanTime || 'None' }}</div>
        <div><strong>Supported Formats:</strong> {{ supportedFormats.length }}</div>
        <div><strong>Scans Count:</strong> {{ scanCount }}</div>
      </div>
      <div v-if="lastError" class="mt-2 text-red-600">
        <strong>Last Error:</strong> {{ lastError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/vue';

// Props
interface Props {
  formats?: string[];
  continuous?: boolean;
  showResult?: boolean;
  facingMode?: 'user' | 'environment';
  showDebug?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  formats: () => ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'],
  continuous: true,
  showResult: false,
  facingMode: 'environment',
  showDebug: false,
});

// Emits
const emit = defineEmits<{
  detect: [result: { rawValue: string; format: string; timestamp: number }];
  error: [error: string];
  started: [];
  stopped: [];
}>();

// Reactive state
const scannerActive = ref(false);
const scannerPaused = ref(false);
const isInitializing = ref(false);
const scannerStatus = ref('inactive');
const lastScanTime = ref<string>('');
const lastError = ref<string>('');
const scanCount = ref(0);

// Scanner instance
let scanner: Html5Qrcode | null = null;

// Format mapping (from your working vanilla code)
const formatMapping: Record<string, any> = {
  'qr_code': Html5QrcodeSupportedFormats.QR_CODE,
  'code_128': Html5QrcodeSupportedFormats.CODE_128,
  'code_39': Html5QrcodeSupportedFormats.CODE_39,
  'code_93': Html5QrcodeSupportedFormats.CODE_93,
  'ean_13': Html5QrcodeSupportedFormats.EAN_13,
  'ean_8': Html5QrcodeSupportedFormats.EAN_8,
  'upc_a': Html5QrcodeSupportedFormats.UPC_A,
  'upc_e': Html5QrcodeSupportedFormats.UPC_E,
  'itf': Html5QrcodeSupportedFormats.ITF,
  'pdf417': Html5QrcodeSupportedFormats.PDF_417,
  'data_matrix': Html5QrcodeSupportedFormats.DATA_MATRIX,
  'aztec': Html5QrcodeSupportedFormats.AZTEC,
  'codabar': Html5QrcodeSupportedFormats.CODABAR,
};

// Get supported formats for html5-qrcode
const supportedFormats = computed(() => {
  return props.formats
    .map(format => formatMapping[format])
    .filter(Boolean);
});

// Scanner configuration (based on your vanilla implementation)
const scannerConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  formatsToSupport: supportedFormats.value,
  aspectRatio: 1.0,
  showTorchButtonIfSupported: true,
  showZoomSliderIfSupported: true,
};

// Success handler (adapted from your vanilla code)
const handleScanSuccess = (decodedText: string, decodedResult: any) => {
  console.log('🎯 Barcode detected:', decodedText);
  
  scanCount.value++;
  lastScanTime.value = new Date().toLocaleTimeString();
  lastError.value = '';

  // Create result object
  const result = {
    rawValue: decodedText,
    format: decodedResult?.result?.format?.formatName || 'unknown',
    timestamp: Date.now()
  };

  // Emit the result
  emit('detect', result);

  // Play success beep (from your vanilla code)
  playBeep();

  // Pause scanner if not in continuous mode
  if (!props.continuous) {
    pauseScanner();
  }
};

// Error handler (adapted from your vanilla code)
const handleScanFailure = (error: string) => {
  // Don't log every scanning failure as they're normal
  // console.warn(`Code scan error = ${error}`);
};

// Start scanner function (based on your vanilla implementation)
const startScanner = async () => {
  if (scannerActive.value) return;

  try {
    isInitializing.value = true;
    scannerStatus.value = 'initializing';
    lastError.value = '';

    // Create scanner instance
    scanner = new Html5Qrcode('html5-qr-reader');

    // Start the scanner
    await scanner.start(
      { facingMode: props.facingMode },
      scannerConfig,
      handleScanSuccess,
      handleScanFailure
    );

    scannerActive.value = true;
    scannerPaused.value = false;
    scannerStatus.value = 'active';
    
    emit('started');
    console.log('✅ Scanner started successfully');

  } catch (error: any) {
    console.error('❌ Scanner start error:', error);
    lastError.value = error.message || 'Failed to start scanner';
    scannerStatus.value = 'error';
    
    emit('error', lastError.value);
    
    // Clean up on error
    await stopScanner();
  } finally {
    isInitializing.value = false;
  }
};

// Stop scanner function (based on your vanilla implementation)
const stopScanner = async () => {
  if (!scanner || !scannerActive.value) return;

  try {
    await scanner.stop();
    scanner.clear();
    scanner = null;
    
    scannerActive.value = false;
    scannerPaused.value = false;
    scannerStatus.value = 'inactive';
    
    emit('stopped');
    console.log('🛑 Scanner stopped successfully');

  } catch (error: any) {
    console.error('❌ Scanner stop error:', error);
    lastError.value = error.message || 'Failed to stop scanner';
  }
};

// Pause scanner (from your vanilla implementation)
const pauseScanner = async () => {
  if (!scanner || !scannerActive.value) return;

  try {
    await scanner.pause(true);
    scannerPaused.value = true;
    scannerStatus.value = 'paused';
    console.log('⏸️ Scanner paused');
  } catch (error: any) {
    console.error('❌ Scanner pause error:', error);
  }
};

// Resume scanner
const resumeScanner = async () => {
  if (!scanner || !scannerPaused.value) return;

  try {
    await scanner.resume();
    scannerPaused.value = false;
    scannerStatus.value = 'active';
    console.log('▶️ Scanner resumed');
  } catch (error: any) {
    console.error('❌ Scanner resume error:', error);
  }
};

// Toggle scanner (main function from your vanilla code)
const toggleScanner = async () => {
  if (!scannerActive.value) {
    await startScanner();
  } else {
    await stopScanner();
  }
};

// Beep function (exactly from your vanilla implementation)
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

// Cleanup on unmount
onUnmounted(async () => {
  await stopScanner();
});

// Expose methods for parent component
defineExpose({
  startScanner,
  stopScanner,
  pauseScanner,
  resumeScanner,
  toggleScanner,
});
</script>

<style scoped>
.scanner-container {
  position: relative;
  max-width: 100%;
  margin: 0 auto;
}

#html5-qr-reader {
  border-radius: 0.5rem;
}

/* Override html5-qrcode default styles */
:deep(#html5-qr-reader) {
  border: none !important;
}

:deep(#html5-qr-reader video) {
  border-radius: 0.5rem;
  width: 100% !important;
  height: auto !important;
}

:deep(#html5-qr-reader canvas) {
  border-radius: 0.5rem;
}
</style>