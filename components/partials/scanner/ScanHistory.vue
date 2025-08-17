<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationData, ScanHistoryItem } from '~/types';

import RegPanel from '@/components/partials/registrations/RegPanel.vue';
import RegCode from '~/components/statuses/RegCode.vue';

interface Props {
  scanHistory: ScanHistoryItem[]
  recentScans: ScanHistoryItem[]
  successfulScans: number
  failedScans: number
  scannerFocusLocked?: boolean
}

const props = defineProps<Props>();

defineEmits<{
  'export-history': []
  'clear-history': []
  'registration-action': [registration: RegistrationData, action: 'checkin' | 'checkout']
}>();

// RegPanel state
const selectedRegId = ref<string>('');

// Search state
const searchQuery = ref('');
const showSearch = ref(false);

const route = useRoute();
const eventId = computed(() => route.params.eventId as string);

const openRegistrationDetails = (registration: RegistrationData) => {
  selectedRegId.value = registration.id;
};

const closeRegPanel = () => {
  selectedRegId.value = '';
};

// Show all answers that have values
const getKeyAnswers = (answers: any[] | undefined) => {
  if (!answers)
    return [];

  return answers.filter((answer: any) => {
    return answer.ans && answer.ans !== '' && answer.ans !== '-';
  }); // Show all answers, no limit
};

// Filtered scan history based on search query
const filteredScans = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.recentScans;
  }

  const query = searchQuery.value.toLowerCase();
  return props.scanHistory.filter((scan) => {
    // Search in code
    if (scan.code.toLowerCase().includes(query))
      return true;

    // Search in attendee name
    if (scan.attendeeName?.toLowerCase().includes(query))
      return true;

    // Search in message
    if (scan.message?.toLowerCase().includes(query))
      return true;

    // Search in ticket name
    if (scan.registrationData?.ticket?.name?.toLowerCase().includes(query))
      return true;

    // Search in attendee email
    if (scan.registrationData?.attendee?.email?.toLowerCase().includes(query))
      return true;

    // Search in custom question answers
    if (scan.registrationData?.ans) {
      const hasMatchingAnswer = scan.registrationData.ans.some((answer: any) =>
        answer.qst?.toLowerCase().includes(query)
        || answer.ans?.toLowerCase().includes(query),
      );
      if (hasMatchingAnswer)
        return true;
    }

    return false;
  });
});
</script>

<template>
  <Card v-if="scanHistory.length > 0">
    <CardHeader class="flex flex-row items-center justify-between">
      <div class="flex items-center gap-2">
        <CardTitle>Scan History</CardTitle>
        <Badge
          variant="secondary"
          class="flex h-6 min-w-6 shrink-0 scale-90 items-center justify-center rounded-full px-1.5 text-xs"
        >
          {{ searchQuery.trim() ? filteredScans.length : scanHistory.length }}
        </Badge>
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          class="bg-card sm:w-auto sm:px-3"
          :class="showSearch ? 'bg-primary/10 text-primary' : ''"
          @click="showSearch = !showSearch; if (!showSearch) searchQuery = ''"
        >
          <Icon icon="heroicons:magnifying-glass" class="size-4 sm:mr-1" />
          <span class="hidden sm:inline">Search</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="bg-card sm:w-auto sm:px-3"
          @click="$emit('export-history')"
        >
          <Icon icon="heroicons:arrow-down-tray" class="size-4 sm:mr-1" />
          <span class="hidden sm:inline">Export</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="bg-card sm:w-auto sm:px-3"
          @click="$emit('clear-history')"
        >
          <Icon icon="heroicons:trash" class="size-4 sm:mr-1" />
          <span class="hidden sm:inline">Clear</span>
        </Button>
      </div>
    </CardHeader>
    <CardContent class="p-0">
      <!-- Search Input -->
      <div v-if="showSearch" class="mb-4 px-5">
        <div
          v-if="props.scannerFocusLocked"
          class="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <Icon icon="heroicons:lock-closed" class="mr-1 inline size-3" />
          Scanner focus is locked. Disable "Lock Focus" to search.
        </div>
        <div class="relative">
          <Icon
            icon="heroicons:magnifying-glass"
            class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, code, email, ticket, or custom answers..."
            class="pl-8"
            :disabled="props.scannerFocusLocked"
          />
          <Button
            v-if="searchQuery.trim()"
            variant="ghost"
            size="sm"
            class="absolute right-2 top-1/2 size-6 -translate-y-1/2 p-0"
            @click="searchQuery = ''"
          >
            <Icon icon="heroicons:x-mark" class="size-4" />
          </Button>
        </div>
      </div>

      <!-- Results -->
      <div class="scroll-area max-h-[600px] overflow-y-auto px-5 pb-8">
        <div v-if="filteredScans.length === 0 && searchQuery.trim()" class="py-8 text-center">
          <Icon icon="heroicons:magnifying-glass" class="mx-auto mb-2 size-8 text-muted-foreground" />
          <p class="text-muted-foreground">
            No results found for "{{ searchQuery }}"
          </p>
        </div>
        <TransitionGroup
          name="scan-item"
          tag="div"
          class="space-y-3"
          appear
        >
          <div
            v-for="scan in filteredScans"
            :key="scan.id"
            class="flex flex-col space-y-2 rounded-lg border  bg-gradient-to-tr from-transparent via-transparent"
            :class="{
              'border-emerald-300 to-emerald-50 dark:border-emerald-500 dark:to-emerald-900': scan.status === 'success',
              'border-blue-300 to-blue-50 dark:border-blue-500 dark:to-blue-900': scan.status === 'lookup',
              'border-red-300 to-red-50 dark:border-red-500 dark:to-red-900': scan.status === 'error',
            }"
          >
            <div class="flex items-start justify-between gap-3  p-3">
              <div class="flex grow flex-col flex-wrap space-y-2 ">
                <!-- Main Info Line -->
                <div
                  class="mb-2 flex items-center gap-2"
                  :class="{
                    'text-green-500': scan.status === 'success',
                    'text-primary': scan.status === 'lookup',
                    'text-destructive': scan.status === 'error',
                  }"
                >
                  <Icon
                    :icon="scan.status === 'success'
                      ? 'heroicons:check-circle'
                      : scan.status === 'lookup'
                        ? 'heroicons:magnifying-glass'
                        : 'heroicons:x-circle'
                    "
                    class="size-4 shrink-0"
                  />
                  <span class="max-w-xs truncate break-words text-xs font-medium" :title="scan.code">{{ scan.code
                  }}</span>
                </div>
                <div v-if="scan.attendeeName" class="mt-1 flex items-center gap-2">
                  <!-- VIP Badge -->
                  <Badge v-if="scan.registrationData?.special_attendee?.is_vip" class="bg-amber-500 text-xs text-white">
                    <Icon icon="solar:crown-bold" class="mr-1 size-2.5" />
                    VIP
                  </Badge>
                  <p class="break-words text-sm font-medium">
                    {{ scan.attendeeName }}
                  </p>
                </div>
                <!-- Attendee & Ticket -->
                <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <RegCode
                    v-if="scan.registrationData?.code"
                    :code="scan.registrationData.code"
                    size="xs"
                    class="w-fit whitespace-nowrap rounded-full border px-2 py-0.5 text-muted-foreground"
                  />
                  <p v-if="scan.registrationData?.ticket?.name" class="break-words text-sm font-medium">
                    {{ scan.registrationData.ticket.name }}
                  </p>
                </div>
                <!-- Status Message (hide redundant messages) -->
                <div v-if="scan.status === 'error'" class="mb-2">
                  <p class="break-words text-sm text-destructive">
                    {{ scan.message }}
                  </p>
                </div>
                <!-- Custom Q&A (Back to badges but compact) -->
                <div
                  v-if="scan.registrationData && getKeyAnswers(scan.registrationData.ans).length > 0"
                  class="flex flex-wrap gap-1"
                >
                  <div
                    v-for="keyAnswer in getKeyAnswers(scan.registrationData.ans)"
                    :key="keyAnswer.id"
                    class="inline-flex items-center gap-1 rounded border  px-3 py-1.5 text-sm"
                  >
                    <span class="break-words text-muted-foreground">
                      {{ keyAnswer.qst }}
                    </span>
                    <span class="break-words font-semibold">
                      {{ keyAnswer.ans }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- Right Side: Time + Actions -->
              <div class="flex shrink-0 flex-col items-end gap-2">
                <!-- Timestamp -->
                <p class="text-xs text-muted-foreground">
                  {{ formatDate(scan.timestamp, 'dd MMM yyyy HH:mm') }}
                </p>
                <!-- Action Status -->
                <div
                  v-if="scan.action"
                  class="flex items-center gap-1 text-xs font-medium"
                  :class="{
                    'text-emerald-600': scan.action !== 'note_only',
                    'text-blue-600': scan.action === 'note_only',
                  }"
                >
                  <Icon :icon="scan.action === 'note_only' ? 'solar:note-bold' : 'tabler:checks'" class="size-3" />
                  <span>{{ scan.action === 'note_only' ? 'Note Added' : scan.action }}</span>
                </div>

                <!-- Action Buttons -->
                <div v-if="scan.registrationData" class="flex items-center gap-1">
                  <!-- View Details Button -->
                  <Button
                    variant="outline"
                    size="sm"
                    class="bg-card"
                    title="View registration details"
                    @click.stop="openRegistrationDetails(scan.registrationData!)"
                  >
                    <Icon icon="heroicons:eye" class="size-4" />
                  </Button>

                  <!-- Check-in/out Actions -->
                  <template v-if="scan.status === 'lookup'">
                    <Button
                      v-if="scan.registrationData.can_checkin"
                      size="sm"
                      @click="$emit('registration-action', scan.registrationData, 'checkin')"
                    >
                      <Icon icon="tabler:checks" class="size-4" />
                    </Button>
                    <Button
                      v-if="scan.registrationData.can_checkout"
                      variant="destructive"
                      size="sm"
                      @click="$emit('registration-action', scan.registrationData, 'checkout')"
                    >
                      <Icon icon="tabler:logout" class="size-4" />
                    </Button>
                  </template>
                </div>
              </div>
            </div>
            <Alert
              v-if="scan.registrationData?.special_attendee?.notes"
              variant="warning"
              class="rounded-t-none border-0"
            >
              <AlertTitle class="text-xs">
                Staff Note:
              </AlertTitle>
              <AlertDescription>
                {{ scan.registrationData.special_attendee.notes }}
              </AlertDescription>
            </Alert>
          </div>
        </TransitionGroup>
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

<style scoped>
/* Scan item transition animations */
.scan-item-enter-active {
  transition: all 0.4s ease-out;
}

.scan-item-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.scan-item-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.scan-item-leave-active {
  transition: all 0.3s ease-in;
}

.scan-item-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.scan-item-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Stagger the animations slightly */
.scan-item-move {
  transition: transform 0.3s ease;
}
</style>
