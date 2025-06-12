<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useClipboard } from '@vueuse/core';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  value: string
  text?: string
  copiedText?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  buttonClass?: string
  iconClass?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const props = withDefaults(defineProps<Props>(), {
  buttonClass: '',
  copiedText: 'Copied!',
  iconClass: 'size-4',
  side: 'top',
  size: 'icon',
  text: 'Copy',
  variant: 'link',
});

const { copied, copy, isSupported } = useClipboard();

const handleCopy = () => {
  copy(props.value);
};
</script>

<template>
  <div v-if="isSupported">
    <!-- Show Tooltip when not copied -->
    <TooltipProvider v-if="!copied" :delay-duration="0">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            :variant="variant"
            :size="size"
            :class="buttonClass"
            @click="handleCopy"
          >
            <Icon icon="tabler:copy" :class="iconClass" />
            <span class="sr-only">{{ text }}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent :side="side">
          <p class="text-xs">
            {{ text }}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <!-- Show Popover when copied -->
    <Popover v-else :open="copied">
      <PopoverTrigger as-child>
        <Button
          :variant="variant"
          :size="size"
          :class="buttonClass"
          @click="handleCopy"
        >
          <Icon icon="tabler:copy" :class="iconClass" />
          <span class="sr-only">{{ text }}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        :side="side"
        class="w-auto border-0 p-2 text-xs dark:bg-slate-900"
      >
        <p>{{ copiedText }}</p>
      </PopoverContent>
    </Popover>
  </div>
</template>
