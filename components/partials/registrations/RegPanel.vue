<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { useScrollLock } from '@vueuse/core';
import { onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { toast } from 'vue-sonner';

import EmptyState from '@/components/EmptyState.vue';
import NotesCard from '@/components/partials/registrations/details/NotesCard.vue';
import PayMethodLogo from '@/components/partials/registrations/PayMethodLogo.vue';
import RegDetailsSummary from '@/components/partials/registrations/RegDetailsSummary.vue';
import StatusBadge from '@/components/statuses/StatusBadge.vue';
import { formatCurrency, formatDate } from '@/utils';

const props = defineProps({
  evtId: String,
  regId: String,
  regDetailsOpen: Boolean,
});

const emit = defineEmits(['close-reg-details']);

const route = useRoute();

const eventId = computed(() => props.evtId || route.params.eventId as string);
const regId = computed(() => props.regId || route.params.regId as string);

const queryClient = useQueryClient();

// Handle close to allow animation to finish
const closePanel = () => {
  queryClient.cancelQueries();
  // Add a slight delay to allow the animation to complete
  setTimeout(() => {
    emit('close-reg-details');
  }, 200); // Match this with your leave transition duration
};

const loading = ref(false);
const panelContent = ref<HTMLElement | null>(null);
const closeBtn = ref<HTMLElement | null>(null);

const isLocked = ref(false);

// VIP functionality
const isTogglingVip = ref(false);

const { $galantisApi } = useNuxtApp();

// Get event configuration
const getEventData = async (signal: AbortSignal) => {
  if (!eventId.value)
    return null;

  return $galantisApi
    .get(`/event/${eventId.value}`, { signal })
    .then(response => response.data)
    .catch(() => null);
};

const { data: eventData } = useQuery({
  enabled: !!eventId.value,
  queryFn: ({ signal }) => getEventData(signal),
  queryKey: ['eventDetails', { evtId: eventId.value }],
  staleTime: 5 * 60 * 1000, // 5 minutes
});

const specialAttendee = computed(() => data.value?.special_attendee);

// Check if VIP functionality is enabled for this event
const isVipEnabled = computed(() => !!eventData.value?.has_vip);

// VIP toggle functionality
const toggleVipStatus = async () => {
  if (isTogglingVip.value || !data.value)
    return;

  try {
    isTogglingVip.value = true;
    const currentVipStatus = specialAttendee.value?.is_vip || false;

    await $galantisApi.put(`/event/${eventId.value}/registrations/${data.value.id}/vip`, {
      is_vip: !currentVipStatus,
    });

    // Refetch data to get latest state
    await refetch();

    toast.success(
      currentVipStatus ? 'VIP status removed' : '👑 Marked as VIP! 👑',
      {
        description: `${data.value.fullname} is now ${!currentVipStatus ? 'a VIP attendee ✨' : 'a regular attendee'}`,
      },
    );
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to update VIP status');
    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    isTogglingVip.value = false;
  }
};

// Handle updates from components
const handleNotesUpdate = async () => {
  // Refetch data to get latest state
  await refetch();
};

// Group link for viewing group members
const groupMembersLink = computed(() => {
  if (!data.value?.is_group || !data.value?.code) return '';
  const groupPrefix = data.value.code.split('-')[0];
  return `/event/${eventId.value}/registrations?order=desc&page=1&perPage=10&search=${groupPrefix}-&sortBy=date`;
});

// close on click outside
const clickHandler = (event: MouseEvent) => {
  const target = event.target as Node; // Type assertion for the target
  if (
    !props.regDetailsOpen
    || (panelContent.value && panelContent.value.contains(target as Node))
    || (closeBtn.value && closeBtn.value.contains(target as Node))
  ) {
    return;
  }
  closePanel();
};

// close if the esc key is pressed
const keyHandler = (event: KeyboardEvent) => {
  if (!props.regDetailsOpen || event.key !== 'Escape')
    return;
  closePanel();
};

// Getting registered data from passed regId
const getData = async (signal: AbortSignal) => {
  if (!eventId.value || !regId.value)
    return [];

  // Set loading to true
  loading.value = true;

  const { $galantisApi } = useNuxtApp();

  return $galantisApi
    .get(`/event/${eventId.value}/registrations/${regId.value}`, {
      signal,
    })
    .then(response => response.data)
    .catch((error) => {
      throw new Error(error);
    })
    .finally(() => {
      loading.value = false;
    });
};

// Fetching data with useQuery and TypeScript for response typing
const { data, isError, isRefetching, refetch } = useQuery({
  // After the data is fetched, set loading to false
  enabled: !!eventId.value && !!regId.value,
  placeholderData: {},
  queryFn: ({ signal }) => getData(signal),
  queryKey: ['regDetails', { evtId: eventId.value, regId: regId.value }],
});

// Watch for changes in route or events data to update the selected event
watchEffect(() => {
  isLocked.value = props.regDetailsOpen;

  if (regId.value) {
    // Reset data
    refetch();
  }
});

onMounted(() => {
  if (import.meta.client) {
    const scrollLock = useScrollLock(document.body);

    watchEffect(() => {
      scrollLock.value = props.regDetailsOpen;
    });
  }

  document.addEventListener('click', clickHandler);
  document.addEventListener('keydown', keyHandler);
});

onUnmounted(async () => {
  loading.value = false;
  document.removeEventListener('click', clickHandler);
  document.removeEventListener('keydown', keyHandler);
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-100 ease-in-out"
    enter-from-class="translate-x-[20%] opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition duration-200"
    leave-from-class="translate-x-0 "
    leave-to-class="translate-x-[20%] opacity-0"
  >
    <div v-show="regDetailsOpen" class="absolute inset-0 z-30 sm:left-auto sm:block">
      <div class="fixed inset-0 z-20 bg-black/50 sm:hidden" @click.stop="$emit('close-reg-details')" />
      <div
        ref="panelContent"
        class="no-scrollbar fixed inset-0 z-30 overflow-y-auto overflow-x-hidden border-l border-border bg-slate-50 dark:bg-slate-800 sm:sticky sm:top-16 sm:h-[calc(100dvh-64px)] sm:w-[390px]"
      >
        <button
          ref="closeBtn"
          class="group absolute right-0 top-0 mr-6 mt-6 p-2"
          @click.stop="$emit('close-reg-details')"
        >
          <Icon icon="iconamoon:close-thin" class="size-6" />
        </button>

        <div class="px-4 py-8 lg:px-8">
          <div v-if="loading || isRefetching" class="grid gap-4">
            <div>
              <Skeleton class="mx-auto h-8 w-40 bg-muted-foreground/10 p-4" />
            </div>
            <Skeleton class="h-96 bg-muted-foreground/10 p-4" />
            <Skeleton class="h-20 bg-muted-foreground/10 p-4" />
          </div>
          <div v-else-if="isError">
            <EmptyState
              title="An error occurred"
              description="We couldn't load the registration details.
              Please contact support or try again later."
              :img="{ src: '/images/empty-state/no-event.svg', alt: 'Error' }"
              description-class="text-sm"
              :cta2="{
                icon: 'heroicons:arrow-path-solid',
                label: 'Refresh',
                action: refetch,
              }"
            />
          </div>
          <div v-else-if="data" class="mx-auto max-w-sm lg:max-w-none">
            <div class="mb-1 text-center font-semibold text-slate-800 dark:text-slate-100" />
            <div class="text-center text-xs">
              {{ data.date ? formatDate(data.date, 'd MMM yyyy HH:mm') : '-' }}
            </div>
            <!-- Details -->
            <RegDetailsSummary :data="data" class="mt-4" />

            <!-- Registration Type -->
            <div class="mt-4 rounded-lg border border-slate-200 p-3 shadow-sm dark:border-slate-700">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-600 dark:text-slate-400">Registration Type</span>
                <!-- Single Registration -->
                <Badge v-if="!data.is_group" variant="secondary">
                  Single
                </Badge>
                <!-- Group Registration -->
                <NuxtLink 
                  v-else-if="data.is_group && groupMembersLink"
                  :to="groupMembersLink"
                  class="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Group
                  <Icon icon="heroicons:arrow-top-right-on-square" class="size-3" />
                </NuxtLink>
              </div>
            </div>

            <!-- VIP Status -->
            <div
              v-if="isVipEnabled"
              class="mt-4 rounded-lg border p-4 shadow-sm duration-150 ease-in-out"
              :class="specialAttendee?.is_vip
                ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                : 'border-slate-200 dark:border-slate-700'"
            >
              <div class="mb-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Icon icon="solar:crown-bold-duotone" class="size-4 text-amber-500" />
                  <span class="text-sm font-semibold">Special Attendee</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="isTogglingVip"
                  @click.stop="toggleVipStatus"
                >
                  <Icon
                    v-if="isTogglingVip"
                    icon="svg-spinners:ring-resize"
                    class="mr-1 size-3"
                  />
                  <Icon
                    v-else-if="specialAttendee?.is_vip"
                    icon="solar:crown-minimalistic-bold"
                    class="mr-1 size-3 text-amber-500"
                  />
                  <Icon
                    v-else
                    icon="solar:crown-line-duotone"
                    class="mr-1 size-3"
                  />
                  {{ isTogglingVip ? 'Updating...' : (specialAttendee?.is_vip ? 'Remove VIP' : 'Mark VIP') }}
                </Button>
              </div>

              <!-- VIP Status Display -->
              <div v-if="specialAttendee?.is_vip">
                <Badge class="bg-amber-500 text-white">
                  <Icon icon="solar:crown-bold" class="mr-1 size-3" />
                  VIP
                </Badge>
              </div>
            </div>

            <!-- Payments -->
            <div class="mt-6">
              <div class="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Payments
              </div>
              <div
                class="number rounded border border-slate-200 p-4 shadow-sm duration-150 ease-in-out hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              >
                <div class="mb-2 grid grid-cols-12 items-center gap-x-2">
                  <div class="col-span-8 flex items-center space-x-4">
                    <div>
                      <div class="text-sm font-medium">
                        Total
                      </div>
                    </div>
                  </div>
                  <div class="col-span-4 text-right text-slate-800 dark:text-slate-100">
                    {{ data.total ? formatCurrency(data.total) : 0 }}
                  </div>
                </div>
                <div class="mb-2 grid grid-cols-12 items-center gap-x-2">
                  <div class="col-span-8 flex items-center space-x-4">
                    <div>
                      <div class="text-sm font-medium">
                        Paid
                      </div>
                    </div>
                  </div>
                  <div class="col-span-4 text-right text-slate-800 dark:text-slate-100">
                    {{ data.paid ? formatCurrency(data.paid) : 0 }}
                  </div>
                </div>
                <div v-if="data.txn?.pay_method" class="mt-2 grid grid-cols-12 items-center gap-x-2">
                  <!-- Card -->
                  <div class="col-span-8 flex items-center space-x-2">
                    <PayMethodLogo :pay-method="data.txn?.pay_method" />
                    <div>
                      <div class="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {{ data.txn?.pay_method || 'Other' }}
                      </div>
                    </div>
                  </div>
                  <!-- Card status -->
                  <div class="col-span-4 text-right">
                    <StatusBadge :status-id="data.txn?.stt_id" variant="pill" />
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-6 flex items-center space-x-3">
              <div class="w-1/2">
                <a
                  :href="data.invoice_url"
                  target="_blank"
                  class="btn w-full border border-slate-100 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  <Icon icon="tabler:receipt" class="size-4 shrink-0" />
                  <span class="ml-2">Invoice</span>
                </a>
              </div>
              <div v-if="data.stt_id === 'RAP'" class="w-1/2">
                <a
                  :href="data.ticket_url"
                  target="_blank"
                  class="btn border-emerald-border w-full bg-emerald-400 text-sm font-medium text-white hover:border-slate-300 hover:bg-emerald-500 dark:border-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <Icon icon="tabler:ticket" class="size-4 shrink-0" />
                  <span class="ml-2">Ticket</span>
                </a>
              </div>
              <div v-else class="w-1/2">
                <a
                  :href="data.reg_url"
                  target="_blank"
                  class="btn w-full border border-slate-100 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  <Icon icon="tabler:link" class="size-4 shrink-0" />
                  <span class="ml-2">Reg Link</span>
                </a>
              </div>
            </div>

            <!-- Link to registration details page -->
            <div>
              <Button as-child class="mt-4 w-full">
                <NuxtLink :to="`/event/${eventId}/registrations/${regId}`">
                  <Icon icon="solar:clipboard-list-bold-duotone" class="mr-2 size-4" />
                  View Details
                </NuxtLink>
              </Button>
            </div>

            <!-- Answers -->
            <div class="mt-6">
              <div class="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Answers
              </div>
              <div
                class="number rounded border border-slate-200 text-sm shadow-sm duration-150 ease-in-out hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              >
                <div
                  v-for="answer in data.ans"
                  :key="answer.id"
                  class="flex flex-col px-4 py-2 transition-colors hover:bg-slate-200/70 dark:hover:bg-slate-900"
                >
                  <div class="text-xs text-muted-foreground dark:text-slate-500">
                    {{ answer.qst }}
                  </div>
                  <div class="font-medium text-slate-800 dark:text-slate-100">
                    {{ answer.ans.length > 0 ? answer.ans : '-' }}
                  </div>
                </div>
              </div>
            </div>
            <!-- Notes -->
            <div class="mt-6">
              <NotesCard
                v-if="data"
                :registration="data"
                compact
                @update-notes="handleNotesUpdate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
