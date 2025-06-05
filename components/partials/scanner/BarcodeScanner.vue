<!-- components/BarcodeScanner.vue -->
<template>
  <div class="barcode-scanner-wrapper">
    <!-- Scanner Controls -->
    <div v-if="!isActive" class="scanner-controls">
      <Button 
        @click="startScanner" 
        :disabled="isLoading"
        class="w-full"
      >
        <Icon icon="heroicons:camera" class="w-5 h-5 mr-2" />
        {{ isLoading ? 'Starting Camera...' : 'Start Scanner' }}
      </Button>
    </div>

    <!-- Main Scanner -->
    <div v-if="isActive" class="scanner-container" :class="{ 'fullscreen': fullscreen }">
      <QrcodeStream
        :constraints="constraints"
        :paused="paused"
        :torch="torchActive"
        @error="onError"
        @camera-on="onCameraReady"
        @camera-off="onCameraOff"
        class="scanner-stream"
      >
        <!-- Custom overlay -->
        <div class="scanner-overlay">
          <div class="scan-frame">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
          </div>
          <p class="scan-instruction">
            {{ instructionText }}
          </p>
        </div>
      </QrcodeStream>

      <!-- Scanner Action Bar -->
      <div class="scanner-action-bar">
        <Button variant="outline" size="sm" @click="toggleTorch" v-if="torchSupported">
          <Icon :icon="torchActive ? 'heroicons:bolt' : 'heroicons:bolt-slash'" class="w-4 h-4" />
        </Button>
        
        <Button variant="outline" size="sm" @click="switchCamera" v-if="hasMultipleCameras">
          <Icon icon="heroicons:camera-switch" class="w-4 h-4" />
        </Button>
        
        <Button variant="outline" size="sm" @click="toggleFullscreen">
          <Icon :icon="fullscreen ? 'heroicons:arrows-pointing-in' : 'heroicons:arrows-pointing-out'" class="w-4 h-4" />
        </Button>
        
        <Button variant="outline" size="sm" @click="pauseScanner" v-if="!paused">
          <Icon icon="heroicons:pause" class="w-4 h-4" />
        </Button>
        
        <Button variant="outline" size="sm" @click="resumeScanner" v-if="paused">
          <Icon icon="heroicons:play" class="w-4 h-4" />
        </Button>
        
        <Button variant="destructive" size="sm" @click="stopScanner">
          <Icon icon="heroicons:x-mark" class="w-4 h-4 mr-1" />
          Stop
        </Button>
      </div>
    </div>

    <!-- Results Display -->
    <div v-if="lastResult && showLastResult" class="scan-result">
      <div class="result-header">
        <Icon icon="heroicons:check-circle" class="w-5 h-5 text-green-500" />
        <span class="font-medium">Scanned Successfully</span>
        <Button variant="ghost" size="sm" @click="showLastResult = false" class="ml-auto">
          <Icon icon="heroicons:x-mark" class="w-4 h-4" />
        </Button>
      </div>
      <div class="result-content">
        <p class="text-sm text-muted-foreground">Format: {{ lastResult.format }}</p>
        <p class="font-mono text-sm bg-muted p-2 rounded mt-2 break-all">{{ lastResult.rawValue }}</p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ new Date(lastResult.timestamp).toLocaleString() }}
        </p>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-display">
      <div class="error-header">
        <Icon icon="heroicons:exclamation-circle" class="w-5 h-5 text-red-500" />
        <span class="font-medium text-red-700 dark:text-red-400">Scanner Error</span>
      </div>
      <p class="text-sm text-red-600 dark:text-red-300 mt-1">{{ error }}</p>
      <Button variant="outline" size="sm" @click="clearError" class="mt-2">
        Try Again
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'

interface DetectedCode {
  boundingBox: DOMRectReadOnly
  cornerPoints: Array<{ x: number, y: number }>
  format: string
  rawValue: string
  timestamp: number
}

interface ScanResult {
  rawValue: string
  format: string
  timestamp: number
}

const emit = defineEmits<{
  detect: [result: ScanResult]
  error: [error: string]
  cameraReady: []
  cameraOff: []
}>()

const props = withDefaults(defineProps<{
  formats?: string[]
  continuous?: boolean
  torch?: boolean
  facingMode?: 'user' | 'environment'
  showResult?: boolean
}>(), {
  formats: () => [
    'qr_code',
    'aztec',
    'code_128',
    'code_39',
    'code_93',
    'codabar',
    'databar',
    'databar_expanded',
    'data_matrix',
    'dx_film_edge',
    'ean_13',
    'ean_8',
    'itf',
    'maxi_code',
    'micro_qr_code',
    'pdf417',
    'rm_qr_code',
    'upc_a',
    'upc_e'
  ],
  continuous: true,
  torch: false,
  facingMode: 'environment',
  showResult: true
})

// Reactive state
const isActive = ref(false)
const isLoading = ref(false)
const paused = ref(false)
const error = ref<string | null>(null)
const lastResult = ref<ScanResult | null>(null)
const showLastResult = ref(false)
const torchActive = ref(props.torch)
const torchSupported = ref(false)
const hasMultipleCameras = ref(false)
const fullscreen = ref(false)
const currentFacingMode = ref(props.facingMode)

// Computed properties
const barcodeFormats = computed(() => props.formats)

const constraints = computed(() => ({
  facingMode: currentFacingMode.value,
  width: { ideal: fullscreen.value ? 1920 : 1280 },
  height: { ideal: fullscreen.value ? 1080 : 720 }
}))

const instructionText = computed(() => {
  if (paused.value) return 'Scanner paused'
  if (isLoading.value) return 'Starting camera...'
  return 'Position barcode within the frame'
})

// Methods
const startScanner = async () => {
  if (isActive.value) return
  
  clearError()
  isLoading.value = true
  
  try {
    // Check camera permissions first
    await navigator.mediaDevices.getUserMedia({ video: true })
    isActive.value = true
  } catch (err: any) {
    handleCameraError(err)
  } finally {
    isLoading.value = false
  }
}

const stopScanner = () => {
  isActive.value = false
  paused.value = false
  torchActive.value = false
  clearError()
}

const pauseScanner = () => {
  paused.value = true
}

const resumeScanner = () => {
  paused.value = false
  clearError()
}

const toggleTorch = () => {
  if (torchSupported.value) {
    torchActive.value = !torchActive.value
  }
}

const switchCamera = () => {
  if (hasMultipleCameras.value) {
    currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment'
  }
}

const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
}

const onDetect = (detectedCodes: DetectedCode[]) => {
  if (detectedCodes.length === 0) return
  
  const code = detectedCodes[0]
  const result: ScanResult = {
    rawValue: code.rawValue,
    format: code.format,
    timestamp: Date.now()
  }
  
  lastResult.value = result
  showLastResult.value = props.showResult
  
  emit('detect', result)
  
  // Auto-pause after scan if not continuous
  if (!props.continuous) {
    paused.value = true
  }
}

const onError = (err: Error) => {
  console.error('Scanner error:', err)
  handleCameraError(err)
}

const onCameraReady = async () => {
  isLoading.value = false
  
  // Check for multiple cameras
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const cameras = devices.filter(device => device.kind === 'videoinput')
    hasMultipleCameras.value = cameras.length > 1
  } catch (err) {
    console.warn('Could not enumerate camera devices:', err)
  }
  
  // Check torch support (this is tricky and not always reliable)
  torchSupported.value = 'torch' in navigator.mediaDevices.getSupportedConstraints()
  
  emit('cameraReady')
}

const onCameraOff = () => {
  emit('cameraOff')
}

const handleCameraError = (err: any) => {
  let errorMessage = 'Unknown camera error'
  
  if (err.name === 'NotAllowedError') {
    errorMessage = 'Camera access denied. Please allow camera permissions.'
  } else if (err.name === 'NotFoundError') {
    errorMessage = 'No camera device found.'
  } else if (err.name === 'NotSupportedError') {
    errorMessage = 'Camera not supported. Please use HTTPS.'
  } else if (err.name === 'NotReadableError') {
    errorMessage = 'Camera is already in use by another application.'
  } else if (err.name === 'OverconstrainedError') {
    errorMessage = 'Camera constraints not supported.'
  } else if (err.name === 'StreamApiNotSupportedError') {
    errorMessage = 'Your browser does not support camera access.'
  } else {
    errorMessage = err.message || errorMessage
  }
  
  error.value = errorMessage
  emit('error', errorMessage)
}

const clearError = () => {
  error.value = null
}

// Check for HTTPS on mount
onMounted(() => {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    error.value = 'Camera access requires HTTPS. Please use a secure connection.'
  }
})
</script>

<style scoped>
.barcode-scanner-wrapper {
  @apply w-full flex flex-col gap-4;
}

.scanner-container {
  @apply relative w-full h-96 bg-black rounded-lg overflow-hidden;
}

.scanner-container.fullscreen {
  @apply fixed inset-0 z-50 h-screen rounded-none;
}

.scanner-stream {
  @apply w-full h-full;
}

.scanner-overlay {
  @apply absolute inset-0 pointer-events-none flex flex-col items-center justify-center;
}

.scan-frame {
  @apply relative w-64 h-40;
}

.corner {
  @apply absolute w-6 h-6 border-white border-opacity-80;
}

.corner.top-left {
  @apply top-0 left-0 border-t-4 border-l-4;
}

.corner.top-right {
  @apply top-0 right-0 border-t-4 border-r-4;
}

.corner.bottom-left {
  @apply bottom-0 left-0 border-b-4 border-l-4;
}

.corner.bottom-right {
  @apply bottom-0 right-0 border-b-4 border-r-4;
}

.scan-instruction {
  @apply text-white text-sm mt-4 text-center px-4 bg-black bg-opacity-50 rounded-lg py-2;
}

.scanner-action-bar {
  @apply absolute bottom-4 left-4 right-4 flex justify-center gap-2 flex-wrap;
}

.scan-result {
  @apply p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg;
}

.result-header {
  @apply flex items-center gap-2 mb-2;
}

.result-content {
  @apply space-y-2;
}

.error-display {
  @apply p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg;
}

.error-header {
  @apply flex items-center gap-2 mb-2;
}
</style>