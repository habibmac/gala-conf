<!-- components/partials/dashboard/EventPackage.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvent } from '@/composables/useEvent';

const { event } = useEvent();

// Package configurations
const packageConfig = computed(() => {
  if (!event.value?.package)
    return null;

  const packages = {
    starter: {
      name: 'Starter',
      description: 'Perfect for small events',
      icon: 'solar:rocket-bold-duotone',
      color: 'text-blue-500',
      bgColor: 'from-blue-50 dark:from-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      badgeVariant: 'outline' as const,
      features: [
        'Basic Registration',
        'Billing Management',
        'Basic Statistics',
        'Email Support',
      ],
      limits: {
        attendees: '500',
        fee: '6',
      },
    },
    smart: {
      name: 'Smart',
      description: 'Great for growing events',
      icon: 'solar:widget-4-bold-duotone',
      color: 'text-purple-500',
      bgColor: 'from-purple-50 dark:from-purple-950',
      borderColor: 'border-purple-200 dark:border-purple-800',
      badgeVariant: 'default' as const,
      features: [
        'Advanced Registration',
        'Insights & Analytics',
        'Custom Reporting',
        'More Payment Options',
      ],
      limits: {
        attendees: '2,000',
        fee: '7',
      },
    },
    optima: {
      name: 'Optima',
      description: 'All-in-one solution for large events',
      icon: 'solar:crown-bold-duotone',
      color: 'text-amber-500',
      bgColor: 'from-amber-50 dark:from-amber-950',
      borderColor: 'border-amber-200 dark:border-amber-800',
      badgeVariant: 'secondary' as const,
      features: [
        'Full Feature Access',
        'Advanced Check-ins',
        'Custom Insights',
        'Dedicated Support',
      ],
      limits: {
        attendees: 'Unlimited',
        fee: '8',
      },
    },
  };

  return packages[event.value.package as keyof typeof packages] || null;
});

const getPackageBadgeClass = computed(() => {
  if (!packageConfig.value)
    return '';

  switch (event.value?.package) {
    case 'starter':
      return 'bg-blue-500 text-white';
    case 'smart':
      return 'bg-purple-500 text-white';
    case 'optima':
      return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
});
</script>

<template>
  <Card v-if="packageConfig" class="relative h-full overflow-hidden bg-gradient-to-b via-card to-card" :class="[packageConfig.borderColor, packageConfig.bgColor]">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium tracking-normal">
        Event Package
      </CardTitle>
      <Icon :icon="packageConfig.icon" class="size-7" :class="packageConfig.color" />
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <!-- Package name and description -->
        <div class="text-center">
          <div class="mb-2 flex items-center justify-center space-x-2">
            <Badge class="rounded-full px-3 py-1 text-sm font-semibold" :class="getPackageBadgeClass">
              {{ packageConfig.name }}
            </Badge>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ packageConfig.description }}
          </p>
        </div>

        <!-- Package limits -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg p-2 text-center" :class="packageConfig.bgColor">
            <div class="text-sm font-semibold" :class="packageConfig.color">
              {{ packageConfig.limits.attendees }}
            </div>
            <div class="text-xs text-muted-foreground">
              Max Attendees
            </div>
          </div>
          <div class="rounded-lg p-2 text-center" :class="packageConfig.bgColor">
            <div class="text-sm font-semibold" :class="packageConfig.color">
              {{ event.fee
                ? Number(event.fee).toFixed(0)
                : packageConfig.limits.fee }}%
            </div>
            <div class="text-xs text-muted-foreground">
              Platform Fee
            </div>
          </div>
        </div>

        <!-- Key features -->
        <div class="space-y-2">
          <h4 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Key Features
          </h4>
          <div class="space-y-1">
            <div v-for="feature in packageConfig.features" :key="feature" class="flex items-center space-x-2">
              <Icon icon="heroicons:check-circle" class="size-3 shrink-0 text-green-500" />
              <span class="text-xs text-muted-foreground">{{ feature }}</span>
            </div>
          </div>
        </div>

        <!-- Upgrade hint for non-optima packages -->
        <div v-if="event?.package !== 'optima'" class="border-t pt-2">
          <div class="text-center">
            <button class="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700">
              <Icon icon="heroicons:arrow-up-circle" class="mr-1 inline size-3" />
              Upgrade Package
            </button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Fallback for unknown/missing package -->
  <Card v-else class="relative overflow-hidden border-gray-200 dark:border-gray-800">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium tracking-normal">
        Event Package
      </CardTitle>
      <Icon icon="solar:question-circle-bold-duotone" class="size-7 text-gray-500" />
    </CardHeader>
    <CardContent>
      <div class="py-4 text-center">
        <Icon icon="solar:package-bold-duotone" class="mb-2 size-12 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          Package information unavailable
        </p>
        <p class="mt-1 text-xs text-muted-foreground/60">
          Contact support for assistance
        </p>
      </div>
    </CardContent>
  </Card>
</template>
