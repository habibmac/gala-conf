<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationData, ScanHistoryItem } from '~/types';

import RegPanel from '@/components/partials/registrations/RegPanel.vue';

interface Props {
  scanHistory: ScanHistoryItem[]
  recentScans: ScanHistoryItem[]
  successfulScans: number
  failedScans: number
}

defineProps<Props>();

defineEmits<{
  'export-history': []
  'clear-history': []
  'registration-action': [registration: RegistrationData, action: 'checkin' | 'checkout']
}>();

// RegPanel state
const selectedRegId = ref<string>('');

const route = useRoute();
const eventId = computed(() => route.params.eventId as string);

const openRegistrationDetails = (registration: RegistrationData) => {
  selectedRegId.value = registration.id;
};

const closeRegPanel = () => {
  selectedRegId.value = '';
};

// Show all answers that have values (limited for compact display)
const getKeyAnswers = (answers: any[] | undefined) => {
  if (!answers) return [];
  
  return answers.filter((answer: any) => {
    return answer.ans && answer.ans !== '' && answer.ans !== '-';
  }).slice(0, 3); // Limit to 3 for compact display
};

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};
</script>

<template>
  <Card v-if="scanHistory.length > 0">
    <CardHeader class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle>Scan History</CardTitle>
        <CardDescription>
          Recent scans ({{ scanHistory.length }} total)
        </CardDescription>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="$emit('export-history')">
          <Icon icon="heroicons:arrow-down-tray" class="mr-1 size-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" @click="$emit('clear-history')">
          <Icon icon="heroicons:trash" class="mr-1 size-4" />
          Clear
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div class="max-h-96 space-y-3 overflow-y-auto">
        <div
          v-for="scan in recentScans"
          :key="scan.id"
          class="flex items-center justify-between rounded-lg border p-3"
          :class="{
            'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20': scan.status === 'success',
            'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20': scan.status === 'lookup',
            'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20': scan.status === 'error',
          }"
        >
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex items-center gap-2">
              <Icon
                :icon="scan.status === 'success'
                  ? 'heroicons:check-circle'
                  : scan.status === 'lookup'
                    ? 'heroicons:magnifying-glass'
                    : 'heroicons:x-circle'
                "
                :class="{
                  'text-green-500': scan.status === 'success',
                  'text-blue-500': scan.status === 'lookup',
                  'text-red-500': scan.status === 'error',
                }"
                class="size-4 shrink-0"
              />
              <span class="truncate text-sm font-medium">{{ scan.code }}</span>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ formatTimestamp(scan.timestamp) }}
            </p>
            <div v-if="scan.attendeeName" class="mt-1 flex items-center gap-2">
              <span class="text-sm font-medium">{{ scan.attendeeName }}</span>
              <!-- VIP Badge -->
              <Badge
                v-if="scan.registrationData?.special_attendee?.is_vip"
                class="bg-amber-500 text-xs text-white"
              >
                <Icon icon="solar:crown-bold" class="mr-1 size-2" />
                VIP
              </Badge>
            </div>
            <p
              v-if="scan.message"
              class="mt-1 text-xs"
              :class="{
                'text-green-600 dark:text-green-400': scan.status === 'success',
                'text-blue-600 dark:text-blue-400': scan.status === 'lookup',
                'text-red-600 dark:text-red-400': scan.status === 'error',
              }"
            >
              {{ scan.message }}
            </p>

            <!-- Staff Notes display -->
            <div
              v-if="scan.registrationData?.special_attendee?.notes"
              class="mt-2 rounded border-l-2 border-blue-300 bg-blue-50 p-2 text-xs dark:bg-blue-900/20"
            >
              <div class="mb-1 flex items-center gap-1">
                <Icon icon="solar:note-bold" class="size-3 text-blue-600" />
                <span class="font-medium text-blue-700 dark:text-blue-400">Staff Note:</span>
              </div>
              <p class="text-blue-800 dark:text-blue-300">
                {{ scan.registrationData.special_attendee.notes }}
              </p>
            </div>

            <!-- Key Q&A display (compact) -->
            <div
              v-if="scan.registrationData && getKeyAnswers(scan.registrationData.ans).length > 0"
              class="mt-2 flex flex-wrap gap-1"
            >
              <Badge
                v-for="keyAnswer in getKeyAnswers(scan.registrationData.ans)"
                :key="keyAnswer.id"
                variant="secondary"
                class="text-xs"
              >
                {{ keyAnswer.qst }}: {{ keyAnswer.ans }}
              </Badge>
            </div>

            <!-- Legacy Note display (fallback) -->
            <div
              v-else-if="scan.note"
              class="mt-2 rounded border-l-2 border-amber-300 bg-amber-50 p-2 text-xs dark:bg-amber-900/20"
            >
              <div class="mb-1 flex items-center gap-1">
                <Icon icon="heroicons:pencil-square" class="size-3 text-amber-600" />
                <span class="font-medium text-amber-700 dark:text-amber-400">Note:</span>
              </div>
              <p class="text-amber-800 dark:text-amber-300">
                {{ scan.note }}
              </p>
            </div>
          </div>

          <div>
            <Badge v-if="scan.action" variant="outline" class="text-xs">
              {{ scan.action }}
            </Badge>
          </div>

          <div v-if="scan.registrationData" class="flex items-center gap-1">
            <!-- View Details Button -->
            <Button
              variant="ghost"
              size="sm"
              title="View registration details"
              @click.stop="openRegistrationDetails(scan.registrationData!)"
            >
              <Icon icon="heroicons:eye" class="size-4" />
            </Button>

            <!-- Check-in/out Actions -->
            <div v-if="scan.status === 'lookup'" class="flex items-center gap-1">
              <Button
                v-if="scan.registrationData.can_checkin"
                size="sm"
                @click="$emit('registration-action', scan.registrationData, 'checkin')"
              >
                <Icon icon="ph:sign-in" class="size-4" />
              </Button>
              <Button
                v-if="scan.registrationData.can_checkout"
                variant="destructive"
                size="sm"
                @click="$emit('registration-action', scan.registrationData, 'checkout')"
              >
                <Icon icon="ph:sign-out" class="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Registration Details Panel -->
  <RegPanel
    :reg-details-open="selectedRegId !== ''"
    :evt-id="eventId"
    :reg-id="selectedRegId || undefined"
    @close-reg-details="closeRegPanel"
  />
</template>
