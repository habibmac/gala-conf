<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  availableModes: Array<{
    value: string
    label: string
    description: string
    icon: string
    color: string
  }>
  supportedFormats: string[]
}

defineProps<Props>();

const scannerInstructions = [
  {
    title: 'Select Session',
    description: 'Choose the active session for scanning.',
  },
  {
    title: 'Choose Input Mode',
    description: 'Use camera scanner or manual entry.',
  },
  {
    title: 'Process & Review',
    description: 'View results and take actions as needed.',
  },
];

const displayFormat = (format: string) => {
  switch (format) {
    case 'qr_code':
      return 'QR Code';
    case 'ean_13':
      return 'EAN-13';
    case 'ean_8':
      return 'EAN-8';
    case 'code_128':
      return 'Code 128';
    case 'code_39':
      return 'Code 39';
    default:
      return format;
  }
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Scanner Instructions</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-4">
          <div v-for="(step, index) in scannerInstructions" :key="index" class="flex items-start gap-3">
            <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span class="text-sm font-semibold text-primary">{{ index + 1 }}</span>
            </div>
            <div>
              <h4 class="font-semibold">
                {{ step.title }}
              </h4>
              <p class="text-sm text-muted-foreground">
                {{ step.description }}
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="font-semibold">
            Scanner Modes
          </h4>
          <div class="space-y-2 text-sm">
            <div v-for="mode in availableModes" :key="mode.value" class="flex items-center gap-2">
              <Icon :icon="mode.icon" class="size-4" :style="{ color: mode.color }" />
              <span><strong>{{ mode.label }}:</strong> {{ mode.description }}</span>
            </div>
          </div>

          <div class="mt-4">
            <h4 class="mb-2 font-semibold">
              Supported Formats
            </h4>
            <div class="grid grid-cols-2 gap-1 text-xs">
              <div v-for="format in supportedFormats" :key="format" class="flex items-center gap-2">
                <Icon icon="heroicons:bars-3" class="size-4" />
                {{ displayFormat(format) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
