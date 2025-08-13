<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useFocus } from '@vueuse/core';

import type { ScannerMode, ScannerSettings } from '~/types';

interface Props {
  scannerSettings: ScannerSettings | null
  selectedDatetime: string
  scannerMode: ScannerMode
  unifiedInput: string
  isProcessing: boolean
  isSearching: boolean
  canScan: boolean
  isScannerOpen: boolean
  scannerFocusLocked?: boolean
  availableModes: Array<{
    value: string
    label: string
    description: string
    icon: string
    color: string
  }>
  modeConfig: Record<string, any>
}

const props = defineProps<Props>();

defineEmits<{
  'update:selectedDatetime': [value: string]
  'update:scannerMode': [value: ScannerMode]
  'update:unifiedInput': [value: string]
  'update:isScannerOpen': [value: boolean]
  'update:scannerFocusLocked': [value: boolean]
  'unified-action': []
  'toggle-scanner': []
}>();

const targetInput = shallowRef();
const { focused } = useFocus(targetInput, { initialValue: true });

// Auto focus when focus lock is enabled
watch(() => props.scannerFocusLocked, (isLocked) => {
  if (isLocked) {
    nextTick(() => {
      focused.value = true;
    });
  }
});

// Initial focus if focus lock is already enabled
onMounted(() => {
  if (props.scannerFocusLocked) {
    nextTick(() => {
      focused.value = true;
    });
  }
});

const getInputPlaceholder = () => {
  switch (props.scannerMode) {
    case 'search':
      return 'Search by name, email, or reg code...';
    case 'lookup':
      return 'Enter reg code to lookup...';
    case 'continuous':
      return 'Enter reg code to check in...';
    default:
      return 'Enter reg code...';
  }
};

const getActionButtonLabel = () => {
  switch (props.scannerMode) {
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
</script>

<template>
  <div class="grid gap-4">
    <!-- Main Layout -->
    <div class="space-y-2">
      <!-- Input Row -->
      <div class="flex items-center gap-2">
        <!-- Mode Selection -->
        <Select
          :model-value="scannerMode"
          @update:model-value="$emit('update:scannerMode', $event as ScannerMode)"
        >
          <SelectTrigger class="size-12 bg-card p-2 md:h-12 md:w-auto md:px-3">
            <SelectValue placeholder="Select scanner mode">
              <!-- Mobile & Tablet: Icon only -->
              <Icon
                :icon="modeConfig[scannerMode].icon"
                class="size-5 md:hidden"
                :style="{ color: modeConfig[scannerMode].color }"
              />
              <!-- Desktop: Icon + Label -->
              <div class="hidden items-center gap-2 font-medium md:flex">
                <Icon
                  :icon="modeConfig[scannerMode].icon"
                  class="size-5 text-muted-foreground"
                  :style="{ color: modeConfig[scannerMode].color }"
                />
                <span>{{ modeConfig[scannerMode].title }}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="mode in availableModes"
              :key="mode.value"
              :value="mode.value"
              class="px-4 py-3"
            >
              <div class="flex items-center gap-2">
                <Icon :icon="mode.icon" class="size-5" :style="{ color: mode.color }" />
                <span class="font-medium">{{ mode.label }}</span>
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                {{ mode.description }}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Input Field with Lock Toggle -->
        <div class="relative grow">
          <Input
            ref="targetInput"
            :model-value="unifiedInput"
            :placeholder="getInputPlaceholder()"
            class="h-12 bg-card px-12 text-base dark:bg-background"
            data-scanner-input="true"
            @update:model-value="$emit('update:unifiedInput', $event as ScannerMode)"
            @keyup.enter="$emit('unified-action')"
          />

          <!-- Lock Focus Button -->
          <Button
            variant="ghost"
            size="sm"
            class="absolute left-2 top-1/2 size-8 -translate-y-1/2 p-0"
            :class="{
              'border border-primary text-primary': scannerFocusLocked,
            }"
            tabindex="-1"
            title="Focus scanner input"
            @click="$emit('update:scannerFocusLocked', !scannerFocusLocked)"
          >
            <Icon :icon="scannerFocusLocked ? 'tabler:lock' : 'tabler:lock-open'" class="size-4" />
          </Button>

          <!-- Reset Button -->
          <Button
            v-if="unifiedInput"
            class="absolute right-2 top-1/2 size-5 -translate-y-1/2 rounded-full p-0"
            variant="ghost"
            @click="$emit('update:unifiedInput', '')"
          >
            <Icon icon="heroicons:x-mark" class="size-4" />
          </Button>
        </div>

        <!-- Action Button (Desktop only) -->
        <Button
          :disabled="!unifiedInput.trim() || isProcessing || isSearching"
          class="hidden h-12 md:flex"
          @click="$emit('unified-action')"
        >
          <Icon
            v-if="isProcessing || (scannerMode === 'search' && isSearching)"
            icon="eos-icons:three-dots-loading"
            class="mr-2 size-4"
          />
          {{ getActionButtonLabel() }}
        </Button>
        <div class="flex justify-center">
          <Button
            class="h-12 w-full bg-teal-500 hover:bg-teal-600"
            :disabled="!canScan"
            @click="$emit('toggle-scanner')"
          >
            <Icon :icon="isScannerOpen ? 'heroicons:x-mark' : 'heroicons:camera'" class="size-5 md:mr-2" />
            <span class="hidden md:inline-block">{{ isScannerOpen ? 'Close Camera' : 'Use Camera' }}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
