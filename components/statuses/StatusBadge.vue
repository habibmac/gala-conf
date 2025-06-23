<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getStatusIdFromText, getStatusInfo } from '@/utils/status-map';

interface Props {
  status?: string
  statusId?: string
  withIcon?: boolean
  iconOnly?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'badge' | 'text' | 'pill' | 'dot'
  tooltip?: string
  noTooltip?: boolean
  customContent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  status: '',
  statusId: '',
  withIcon: true,
  iconOnly: false,
  size: 'default',
  variant: 'badge',
  noTooltip: false,
  customContent: false,
});

// Get status info
const resolvedStatusId = computed(() => {
  if (props.statusId)
    return props.statusId;
  if (props.status)
    return getStatusIdFromText(props.status);
  return 'UNKNOWN';
});

const statusInfo = computed(() => getStatusInfo(resolvedStatusId.value));

// Size classes
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return { text: 'text-xs', icon: 'size-3', padding: 'px-1.5 py-0.5' };
    case 'lg': return { text: 'text-sm', icon: 'size-5', padding: 'px-3 py-1.5' };
    default: return { text: 'text-xs', icon: 'size-4', padding: 'px-2 py-1' };
  }
});

// Variant-specific classes using hardcoded status classes
const variantClasses = computed(() => {
  const baseClasses = {
    badge: 'inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    pill: `inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses.value.padding} ${sizeClasses.value.text}`,
    text: 'font-medium',
    dot: `inline-flex items-center gap-2 ${sizeClasses.value.text} font-medium`,
  };

  const statusClasses = {
    badge: statusInfo.value.badgeClass,
    pill: statusInfo.value.pillClass,
    text: statusInfo.value.textClass,
    dot: '',
  };

  return `${baseClasses[props.variant]} ${statusClasses[props.variant]}`;
});

const useCustomStyling = computed(() => resolvedStatusId.value !== 'UNKNOWN');
const tooltipText = computed(() => props.tooltip || statusInfo.value.label);
const showTooltip = computed(() => !props.noTooltip && (props.iconOnly || props.tooltip));
</script>

<template>
  <TooltipProvider v-if="showTooltip">
    <Tooltip>
      <TooltipTrigger as-child>
        <!-- Custom styled variants using hardcoded classes -->
        <span
          v-if="useCustomStyling && (variant === 'badge' || variant === 'pill')"
          :class="[variantClasses]"
        >
          <Icon v-if="withIcon && !iconOnly" :icon="statusInfo.icon" :class="sizeClasses.icon" />
          <Icon v-else-if="iconOnly" :icon="statusInfo.icon" :class="sizeClasses.icon" />
          <slot v-if="customContent && !iconOnly" />
          <span v-else-if="!iconOnly">{{ statusInfo.label }}</span>
        </span>

        <!-- Text variant -->
        <span v-else-if="variant === 'text'" :class="[variantClasses]">
          <Icon
            v-if="withIcon && !iconOnly"
            :icon="statusInfo.icon"
            class="mr-1 inline"
            :class="[sizeClasses.icon]"
          />
          <slot v-if="customContent && !iconOnly" />
          <span v-else-if="!iconOnly">{{ statusInfo.label }}</span>
        </span>

        <!-- Dot variant -->
        <span v-else-if="variant === 'dot'" :class="[variantClasses]">
          <span class="inline-block size-2 rounded-full" :class="statusInfo.dotClass" />
          <slot v-if="customContent && !iconOnly" />
          <span v-else-if="!iconOnly" :class="statusInfo.textClass">{{ statusInfo.label }}</span>
        </span>

        <!-- Fallback to shadcn Badge -->
        <Badge
          v-else
          :variant="statusInfo.badgeVariant"
          class="inline-flex cursor-help items-center gap-1"
          :class="[sizeClasses.text]"
        >
          <Icon v-if="withIcon && !iconOnly" :icon="statusInfo.icon" :class="sizeClasses.icon" />
          <Icon v-else-if="iconOnly" :icon="statusInfo.icon" :class="sizeClasses.icon" />
          <slot v-if="customContent && !iconOnly" />
          <span v-else-if="!iconOnly">{{ statusInfo.label }}</span>
        </Badge>
      </TooltipTrigger>

      <TooltipContent>
        <p>{{ tooltipText }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <!-- Non-tooltip versions -->
  <template v-else>
    <span v-if="useCustomStyling && (variant === 'badge' || variant === 'pill')" :class="variantClasses">
      <Icon v-if="withIcon && !iconOnly" :icon="statusInfo.icon" :class="sizeClasses.icon" />
      <Icon v-else-if="iconOnly" :icon="statusInfo.icon" :class="sizeClasses.icon" />
      <slot v-if="customContent && !iconOnly" />
      <span v-else-if="!iconOnly">{{ statusInfo.label }}</span>
    </span>

    <span v-else-if="variant === 'text'" :class="variantClasses">
      <Icon
        v-if="withIcon && !iconOnly"
        :icon="statusInfo.icon"
        class="mr-1 inline"
        :class="[sizeClasses.icon]"
      />
      <slot v-if="customContent && !iconOnly" />
      <span v-else-if="!iconOnly">{{ statusInfo.label }}</span>
    </span>

    <span v-else-if="variant === 'dot'" :class="variantClasses">
      <span class="inline-block size-2 rounded-full" :class="statusInfo.dotClass" />
      <slot v-if="customContent && !iconOnly" />
      <span v-else-if="!iconOnly" :class="statusInfo.textClass">{{ statusInfo.label }}</span>
    </span>

    <Badge
      v-else
      :variant="statusInfo.badgeVariant"
      class="inline-flex items-center gap-1"
      :class="[sizeClasses.text]"
    >
      <Icon v-if="withIcon && !iconOnly" :icon="statusInfo.icon" :class="sizeClasses.icon" />
      <Icon v-else-if="iconOnly" :icon="statusInfo.icon" :class="sizeClasses.icon" />
      <slot v-if="customContent && !iconOnly" />
      <span v-else-if="!iconOnly">{{ statusInfo.label }}</span>
    </Badge>
  </template>
</template>
