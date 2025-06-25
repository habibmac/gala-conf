<!-- components/partials/registrations/details/AttendeeInfo.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationDetails } from '~/types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCountryFlagWithName } from '@/utils';

interface Props {
  registration: RegistrationDetails
}

const props = defineProps<Props>();

const getInitialsName = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('');
};

const attendeeInitials = computed(() => {
  return getInitialsName(props.registration.fullname);
});

const countryInfo = computed(() => {
  return getCountryFlagWithName(props.registration.country_code);
});

const displayData = [
  { label: 'Age', value: `${props.registration.age} years old` },
  { label: 'Gender', value: props.registration.gender },
  { label: 'Nationality', value: countryInfo.value },
  { label: 'Address', value: props.registration.address },
  { label: 'City', value: props.registration.city },
  { label: 'Registration Date', value: formatDate(props.registration.date, 'dd MMM yyyy HH:mm') },
];

const generateAvatarBgColor = (email: string): string => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Force to 32-bit integer
  }

  // Convert to 6-digit hex color
  const color = Math.abs(hash % 0xFFFFFF).toString(16);
  return color.padStart(6, '0');
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Icon icon="solar:user-circle-bold-duotone" class="size-5 text-orange-500" />
        Attendee Information
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Main Info -->
      <div class="flex items-start gap-4">
        <Avatar class="size-16">
          <AvatarImage :src="`https://www.ui-avatars.com/api/?name=${registration.fullname}&background=${generateAvatarBgColor(registration.code)}&color=fff`" />
          <AvatarFallback class="text-lg">
            {{ attendeeInitials }}
          </AvatarFallback>
        </Avatar>
        <div class="flex-1 space-y-2">
          <div>
            <h3 class="text-xl font-semibold">
              {{ registration.fullname }}
            </h3>
            <p class="text-muted-foreground">
              {{ registration.email }}
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon icon="heroicons:phone" class="size-4" />
            {{ registration.phone }}
          </div>
        </div>
      </div>

      <Separator />

      <!-- Details Grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-for="item in displayData" :key="item.label">
          <label class="text-sm font-medium text-muted-foreground">{{ item.label }}</label>
          <p class="text-sm font-medium">
            {{ item.value }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
