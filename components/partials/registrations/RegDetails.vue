<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { useScrollLock } from '@vueuse/core';
import { onMounted, onUnmounted, ref, toRef, watchEffect } from 'vue';

import CopyButton from '@/components/CopyButton.vue';
import EmptyState from '@/components/EmptyState.vue';
import PayMethodLogo from '@/components/partials/registrations/PayMethodLogo.vue';
import StatusBadge from '@/components/statuses/StatusBadge.vue';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getCountryFlagWithName } from '@/utils';
import { getStatusInfo } from '@/utils/status-map';

const props = defineProps({
  evtId: {
    default: '',
    type: String,
  },
  regDetailsOpen: Boolean,
  regId: {
    default: '',
    type: String,
  },
});

const emit = defineEmits(['close-reg-details']);
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
  if (!props.evtId || !props.regId)
    return [];

  // Set loading to true
  loading.value = true;

  const { $galantisApi } = useNuxtApp();

  return $galantisApi
    .get(`/event/${props.evtId}/registrations/${props.regId}`, {
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
  enabled: !!props.evtId && !!props.regId,
  placeholderData: {},
  queryFn: ({ signal }) => getData(signal),
  queryKey: ['regDetails', { evtId: props.evtId, regId: toRef(props.regId) }],
});

// Watch for changes in route or events data to update the selected event
watchEffect(() => {
  isLocked.value = props.regDetailsOpen;

  if (props.regId) {
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
            <div class="mt-8 drop-shadow-lg">
              <!-- Top -->
              <div
                class="rounded-t-xl bg-white px-5 pb-2.5 pt-4 text-center text-slate-800 dark:bg-slate-700 dark:text-slate-100"
              >
                <div class="b-1 text-2xl font-semibold">
                  {{ data.fullname || '-' }}
                </div>
                <div class="mb-3 text-sm font-medium">
                  {{ data.ticket_name }}
                </div>
                <StatusBadge
                  :status-id="data.stt_id"
                  :text="data.status"
                  class="mb-2 inline-flex items-center justify-center"
                />
              </div>
              <!-- Divider -->
              <div class="flex items-center justify-between" aria-hidden="true">
                <svg class="size-5 fill-white dark:fill-slate-700" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 20c5.523 0 10-4.477 10-10S5.523 0 0 0h20v20H0Z" />
                </svg>
                <div class="flex h-5 w-full grow flex-col justify-center bg-white dark:bg-slate-700">
                  <div class="h-px w-full border-t border-dashed border-slate-200 dark:border-slate-600" />
                </div>
                <svg class="size-5 rotate-180 fill-white dark:fill-slate-700" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 20c5.523 0 10-4.477 10-10S5.523 0 0 0h20v20H0Z" />
                </svg>
              </div>
              <!-- Bottom -->
              <div
                class="space-y-3 rounded-b-xl bg-white p-5 pt-2.5 text-sm dark:bg-slate-800 dark:bg-gradient-to-b dark:from-slate-700 dark:to-slate-700/70"
              >
                <div v-if="data.code" class="flex flex-col items-center justify-center space-y-2">
                  <div class="w-40">
                    <ClientOnly>
                      <Qrcode :value="data.reg_url_link" />
                    </ClientOnly>
                  </div>
                  <div class="relative">
                    <Badge
                      variant="outline"
                      class="text-md number rounded-full border border-muted-foreground font-medium tabular-nums"
                    >
                      {{ data.code }}
                    </Badge>
                    <!-- Copy btn -->
                    <CopyButton
                      :value="data.code"
                      text="Copy code"
                      button-class="absolute -right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100"
                      side="top"
                    />
                  </div>
                </div>
                <div class="flex justify-between space-x-1">
                  <span class="">Email:</span>
                  <span class="text-right font-medium text-slate-700 dark:text-slate-100">{{ data.email }}</span>
                </div>
                <div class="flex justify-between space-x-1">
                  <span class="">Phone:</span>
                  <span class="text-right font-medium text-slate-700 dark:text-slate-100">{{ data.phone }}</span>
                </div>
                <div class="flex justify-between space-x-1">
                  <span class="">Address:</span>
                  <span class="text-right font-medium text-slate-700 dark:text-slate-100">{{ data.address }}</span>
                </div>
                <div class="flex justify-between space-x-1">
                  <span class="">City:</span>
                  <span class="text-right font-medium text-slate-700 dark:text-slate-100">{{ data.city }}</span>
                </div>
                <div class="flex justify-between space-x-1">
                  <span class="">Nationality:</span>
                  <span class="text-right font-medium text-slate-700 dark:text-slate-100">
                    {{ getCountryFlagWithName(data.country_code) }}
                  </span>
                </div>
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
                    <!-- <div
                      class="badge inline-flex rounded-full px-2.5 py-1 text-center text-xs font-medium"
                      :class="getStatusInfo(data.txn.stt_id).dotClass"
                    >
                      {{ data.txn?.status }}
                    </div> -->
                    <StatusBadge
                      :status-id="data.txn?.stt_id"
                      variant="pill"
                    />
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
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-6 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M13.5 9.75a.75.75 0 0 0-.75-.75h-6a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 .75-.75m-1 3a.75.75 0 0 0-.75-.75h-5a.75.75 0 1 0 0 1.5h5a.75.75 0 0 0 .75-.75m.25 2.25a.75.75 0 1 1 0 1.5h-6a.75.75 0 0 1 0-1.5z"
                    />
                    <path
                      fill="currentColor"
                      fill-rule="evenodd"
                      d="M6 21.75h13A2.75 2.75 0 0 0 21.75 19v-5.5a.75.75 0 0 0-.75-.75h-3.25V4.943c0-1.423-1.609-2.251-2.767-1.424l-.175.125a2.26 2.26 0 0 1-2.622-.004a3.77 3.77 0 0 0-4.372 0a2.26 2.26 0 0 1-2.622.004l-.175-.125c-1.158-.827-2.767 0-2.767 1.424V18A3.75 3.75 0 0 0 6 21.75M8.686 4.86a2.27 2.27 0 0 1 2.628 0a3.76 3.76 0 0 0 4.366.005l.175-.125a.25.25 0 0 1 .395.203V19c0 .45.108.875.3 1.25H6A2.25 2.25 0 0 1 3.75 18V4.943a.25.25 0 0 1 .395-.203l.175.125a3.76 3.76 0 0 0 4.366-.005M17.75 19v-4.75h2.5V19a1.25 1.25 0 0 1-2.5 0"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="ml-2">Invoice</span>
                </a>
              </div>
              <div v-if="data.stt_id === 'RAP'" class="w-1/2">
                <a
                  :href="data.ticket_url"
                  target="_blank"
                  class="btn border-emerald-border w-full bg-emerald-400 text-sm font-medium text-white hover:border-slate-300 hover:bg-emerald-500 dark:border-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-6 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="none"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M19 19a2 2 0 0 0 2-2v-3a2 2 0 1 1 0-4V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 0 2 2zm-7-7.25v.5M12 8v.5m0 7v.5"
                    />
                  </svg>
                  <span class="ml-2">Ticket</span>
                </a>
              </div>
              <div v-else class="w-1/2">
                <a
                  :href="data.reg_url"
                  target="_blank"
                  class="btn w-full border border-slate-100 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-6 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M7.23 18.25a4 4 0 0 1-2.83-1.16a4.23 4.23 0 0 1 .15-5.95l3.76-3.79A4.44 4.44 0 0 1 11.42 6a4 4 0 0 1 2.83 1.2a4.25 4.25 0 0 1-.15 6l-1.26 1.26a.75.75 0 1 1-1.06-1.06L13 12.1a2.73 2.73 0 0 0 .14-3.84a2.77 2.77 0 0 0-3.8.15l-3.73 3.78A2.74 2.74 0 0 0 5.46 16a2.5 2.5 0 0 0 2 .71a.74.74 0 0 1 .81.67a.75.75 0 0 1-.67.82Z"
                    />
                    <path
                      fill="currentColor"
                      d="M12.58 18a4 4 0 0 1-2.83-1.2a4.25 4.25 0 0 1 .15-6l1.26-1.26a.75.75 0 1 1 1.06 1.06L11 11.9a2.73 2.73 0 0 0-.14 3.84a2.77 2.77 0 0 0 3.8-.15l3.77-3.78A2.74 2.74 0 0 0 18.54 8a2.5 2.5 0 0 0-2-.71a.74.74 0 0 1-.81-.67a.75.75 0 0 1 .67-.82a4 4 0 0 1 3.2 1.11a4.23 4.23 0 0 1-.15 5.95l-3.76 3.79A4.44 4.44 0 0 1 12.58 18"
                    />
                  </svg>
                  <span class="ml-2">Reg URL</span>
                </a>
              </div>
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
              <div class="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Notes
              </div>
              <form>
                <label class="sr-only" for="notes">Write a note</label>
                <textarea
                  id="notes"
                  class="form-textarea w-full focus:border-slate-300"
                  rows="4"
                  placeholder="Write a note…"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
