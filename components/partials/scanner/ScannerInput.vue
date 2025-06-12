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
  'unified-action': []
  'toggle-scanner': []
}>();

const targetInput = shallowRef();
useFocus(targetInput, { initialValue: true });

const getInputPlaceholder = () => {
  switch (props.scannerMode) {
    case 'search':
      return 'Search by name, email, or registration code...';
    case 'lookup':
      return 'Enter registration code to lookup...';
    case 'continuous':
      return 'Enter registration code to check in...';
    default:
      return 'Enter registration code...';
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
    <!-- Main Controls -->
    <div class="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 md:grid-cols-12">
      <!-- Mode Selection -->
      <Select
        :model-value="scannerMode"
        class="w-full"
        @update:model-value="$emit('update:scannerMode', $event as ScannerMode)"
      >
        <SelectTrigger class="h-12 bg-card dark:bg-background md:col-span-3">
          <SelectValue placeholder="Select scanner mode">
            <div class="flex items-center gap-2 font-medium">
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

      <!-- Input Field -->
      <div class="relative">
        <Input
          ref="targetInput"
          :model-value="unifiedInput"
          :placeholder="getInputPlaceholder()"
          class="h-12 grow bg-card text-base dark:bg-background md:col-span-5"
          @update:model-value="$emit('update:unifiedInput', $event as ScannerMode)"
          @keyup.enter="$emit('unified-action')"
        />

        <!-- Reset Button -->
        <Button
          v-if="unifiedInput"
          class="absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-full p-0"
          variant="ghost"
          @click="$emit('update:unifiedInput', '')"
        >
          <Icon icon="heroicons:x-mark" class="size-5" />
        </Button>
      </div>

      <!-- Action Button -->
      <Button
        :disabled="!unifiedInput.trim() || isProcessing || isSearching"
        class="h-12 md:col-span-2"
        @click="$emit('unified-action')"
      >
        <Icon
          v-if="isProcessing || (scannerMode === 'search' && isSearching)"
          icon="eos-icons:three-dots-loading"
          class="mr-2 size-4"
        />
        {{ getActionButtonLabel() }}
      </Button>

      <!-- Camera Button -->
      <Button
        class="h-12 flex-1 bg-teal-500 hover:bg-teal-600 md:col-span-2"
        :disabled="!canScan"
        @click="$emit('toggle-scanner')"
      >
        <div class="flex items-center justify-center">
          <Icon :icon="isScannerOpen ? 'heroicons:x-mark' : 'heroicons:camera'" class="size-5" />
          <span class="ml-2 md:hidden lg:inline-block">{{ isScannerOpen ? 'Close Camera' : 'Use Camera' }}</span>
        </div>
      </Button>
    </div>
  </div>
</template>
