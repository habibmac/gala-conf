<!-- pages/event/[eventId]/tools/ticket-scanner.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/vue'
import BarcodeScanner from '~/components/partials/scanner/BarcodeScanner.vue'
import { useToast } from '@/components/ui/toast/use-toast'

definePageMeta({
  title: 'Ticket Scanner',
  group: 'tools',
  showInMenu: false,
  order: 1,
  icon: 'solar:qr-code-bold-duotone',
  requiresSelectedEvent: true,
  packages: ['optima'],
  roles: ['administrator', 'ee_event_organizer'],
  capabilities: ['ee_read_checkins'],
  layout: 'dashboard-with-sidebar',
})

const { event } = useEvent()
const { toast } = useToast()

const isOpen = ref(false)
const scanHistory = ref<Array<{
  id: string
  code: string
  format: string
  timestamp: number
  status: 'success' | 'error' | 'duplicate'
  message?: string
  attendeeName?: string
}>>([])

// Supported barcode formats for tickets
const ticketFormats = [
  'qr_code',        // QR codes
  'code_128',       // Code 128 (very common for tickets)
  'ean_13',         // EAN-13
  'ean_8',          // EAN-8
  'code_39',        // Code 39
  'code_93',        // Code 93
  'upc_a',          // UPC-A
  'upc_e',          // UPC-E
  'itf',            // ITF-14
  'codabar',        // Codabar 
  'databar',        // GS1 DataBar
  'pdf417',         // PDF417 (2D)
  'data_matrix',    // Data Matrix (2D)
]

function toggleModal() {
  isOpen.value = !isOpen.value
}

const handleScanResult = async (result: { rawValue: string; format: string; timestamp: number }) => {
  console.log('Barcode detected:', result)
  
  // Check for duplicates in recent history (last 10 seconds)
  const recentScans = scanHistory.value.filter(
    scan => scan.code === result.rawValue && (Date.now() - scan.timestamp) < 10000
  )
  
  if (recentScans.length > 0) {
    handleScanError(result, 'Duplicate scan - already processed recently')
    return
  }
  
  try {
    // Call your API to validate the ticket/registration
    const response = await useNuxtApp().$galantisApi.post(
      `/event/${event.value?.id}/checkins/scan`,
      {
        code: result.rawValue,
        format: result.format,
        timestamp: result.timestamp
      }
    )
    
    if (response.data.success) {
      const scanEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code: result.rawValue,
        format: result.format,
        timestamp: result.timestamp,
        status: 'success' as const,
        message: response.data.message || 'Check-in successful',
        attendeeName: response.data.attendee_name
      }
      
      scanHistory.value.unshift(scanEntry)
      
      toast({
        title: 'Check-in Successful ✅',
        description: `${response.data.attendee_name || 'Attendee'} checked in successfully`,
      })
      
      // Play success sound if available
      playSuccessSound()
      
    } else {
      handleScanError(result, response.data.message || 'Invalid ticket')
    }
  } catch (error: any) {
    console.error('Scan validation error:', error)
    handleScanError(result, error.response?.data?.message || 'Validation failed')
  }
}

const handleScanError = (result: { rawValue: string; format: string; timestamp: number }, message: string) => {
  const scanEntry = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    code: result.rawValue,
    format: result.format,
    timestamp: result.timestamp,
    status: 'error' as const,
    message
  }
  
  scanHistory.value.unshift(scanEntry)
  
  toast({
    title: 'Scan Error ⚠️',
    description: message,
    variant: 'destructive'
  })
  
  // Play error sound if available
  playErrorSound()
}

const handleScannerError = (error: string) => {
  toast({
    title: 'Scanner Error',
    description: error,
    variant: 'destructive'
  })
}

const clearHistory = () => {
  scanHistory.value = []
  toast({
    title: 'History Cleared',
    description: 'Scan history has been cleared'
  })
}

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// Optional: Sound feedback
const playSuccessSound = () => {
  try {
    const audio = new Audio('/sounds/success.mp3') // Add sound file to public/sounds/
    audio.volume = 0.3
    audio.play().catch(() => {}) // Ignore errors if sound fails
  } catch {}
}

const playErrorSound = () => {
  try {
    const audio = new Audio('/sounds/error.mp3') // Add sound file to public/sounds/
    audio.volume = 0.3
    audio.play().catch(() => {}) // Ignore errors if sound fails
  } catch {}
}

const exportHistory = () => {
  if (scanHistory.value.length === 0) return
  
  const data = scanHistory.value.map(scan => ({
    timestamp: formatTimestamp(scan.timestamp),
    code: scan.code,
    format: scan.format,
    status: scan.status,
    message: scan.message || '',
    attendee: scan.attendeeName || ''
  }))
  
  const csv = [
    'Timestamp,Code,Format,Status,Message,Attendee',
    ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ticket-scans-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="container mx-auto">
    <div class="flex flex-col sm:flex-row justify-between items-start pt-10 gap-5">
      <header class="sm:grow">
        <h1 class="h2">Ticket Scanner</h1>
        <p class="text-muted-foreground mt-2">
          Scan barcodes and QR codes to check in attendees
        </p>
      </header>

      <div class="w-full sm:w-auto flex gap-2">
        <Button variant="outline" @click="toggleModal" class="flex-1 sm:flex-none">
          <Icon :icon="isOpen ? 'heroicons:x-mark' : 'heroicons:camera'" class="w-5 h-5 mr-2" />
          {{ isOpen ? 'Close Scanner' : 'Open Scanner' }}
        </Button>
      </div>
    </div>

    <!-- Scanner Section -->
    <div v-if="isOpen" class="mt-8">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon icon="heroicons:camera" class="w-5 h-5" />
            Barcode Scanner
          </CardTitle>
          <CardDescription>
            Point the camera at a barcode or QR code to scan. Supports all major barcode formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarcodeScanner
            :formats="ticketFormats"
            :continuous="true"
            :show-result="false"
            facing-mode="environment"
            @detect="handleScanResult"
            @error="handleScannerError"
          />
        </CardContent>
      </Card>
    </div>

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
            <Button variant="outline" size="sm" @click="clearHistory">
              <Icon icon="heroicons:trash" class="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="scan in scanHistory.slice(0, 50)"
              :key="scan.id"
              class="flex items-start justify-between p-3 rounded-lg border"
              :class="{
                'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800': scan.status === 'success',
                'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800': scan.status === 'error'
              }"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <Icon
                    :icon="scan.status === 'success' ? 'heroicons:check-circle' : 'heroicons:x-circle'"
                    :class="{
                      'text-green-500': scan.status === 'success',
                      'text-red-500': scan.status === 'error'
                    }"
                    class="w-4 h-4 flex-shrink-0"
                  />
                  <span class="text-sm font-medium font-mono truncate">{{ scan.code }}</span>
                  <Badge variant="outline" class="text-xs">{{ scan.format }}</Badge>
                </div>
                <p class="text-xs text-muted-foreground">
                  {{ formatTimestamp(scan.timestamp) }}
                </p>
                <p v-if="scan.attendeeName" class="text-sm font-medium mt-1">
                  {{ scan.attendeeName }}
                </p>
                <p v-if="scan.message" class="text-xs mt-1" 
                   :class="{
                     'text-green-600 dark:text-green-400': scan.status === 'success',
                     'text-red-600 dark:text-red-400': scan.status === 'error'
                   }">
                  {{ scan.message }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Instructions Card -->
    <div v-if="!isOpen" class="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Scanner Instructions</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span class="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <h4 class="font-semibold">Open Scanner</h4>
                  <p class="text-sm text-muted-foreground">Click "Open Scanner" to activate camera</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span class="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <h4 class="font-semibold">Position Code</h4>
                  <p class="text-sm text-muted-foreground">Point camera at barcode or QR code</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span class="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <h4 class="font-semibold">Automatic Processing</h4>
                  <p class="text-sm text-muted-foreground">System validates and checks in attendee</p>
                </div>
              </div>
            </div>
            
            <div class="space-y-3">
              <h4 class="font-semibold">Supported Formats</h4>
              <div class="grid grid-cols-2 gap-1 text-xs">
                <div class="flex items-center gap-2">
                  <Icon icon="heroicons:qr-code" class="w-4 h-4" />
                  QR Code
                </div>
                <div class="flex items-center gap-2">
                  <Icon icon="heroicons:bars-3" class="w-4 h-4" />
                  Code 128
                </div>
                <div class="flex items-center gap-2">
                  <Icon icon="heroicons:bars-3" class="w-4 h-4" />
                  EAN-13/8
                </div>
                <div class="flex items-center gap-2">
                  <Icon icon="heroicons:bars-3" class="w-4 h-4" />
                  UPC-A/E
                </div>
                <div class="flex items-center gap-2">
                  <Icon icon="heroicons:bars-3" class="w-4 h-4" />
                  Code 39
                </div>
                <div class="flex items-center gap-2">
                  <Icon icon="heroicons:bars-3" class="w-4 h-4" />
                  PDF417
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>