<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { useInsight } from '@/composables/useInsight';

useHead({
  title: 'Edit Insight',
});

definePageMeta({
  capabilities: ['ee_edit_insights'],
  group: 'insights',
  icon: 'solar:widget-4-bold-duotone',
  layout: 'dashboard-with-sidebar',
  packages: ['smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Edit Insight',
});

const route = useRoute();

const eventId = computed(() => route.params.eventId as string || '');
const insightId = route.params.insightId as string;

const { insightData } = useInsight(eventId, insightId);
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-5">
      <NuxtLink
        :to="`/event/${eventId}/insights`"
        class="inline-flex items-center space-x-1 pb-5 text-xs text-slate-500 hover:underline"
      >
        <Icon icon="tabler:arrow-left" class="size-3" />
        <span>Back to All Insights</span>
      </NuxtLink>
      <!-- subtitle -->
      <h2 class="font-medium text-slate-500">
        Edit Insight
      </h2>
      <h1 class="h2 mb-5">
        {{ insightData?.title }}
      </h1>
    </header>

    <section>
      <div class="m-auto my-16 max-w-2xl">
        <div class="px-4 text-center">
          <div
            class="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800"
          >
            <svg class="h-6 w-5 fill-current" viewBox="0 0 20 24">
              <path
                class="text-slate-500 dark:text-slate-600"
                d="M10 10.562l9-5-8.514-4.73a1 1 0 00-.972 0L1 5.562l9 5z"
              />
              <path
                class="text-slate-300 dark:text-slate-400"
                d="M9 12.294l-9-5v10.412a1 1 0 00.514.874L9 23.294v-11z"
              />
              <path
                class="text-slate-400 dark:text-slate-500"
                d="M11 12.294v11l8.486-4.714a1 1 0 00.514-.874V7.295l-9 4.999z"
              />
            </svg>
          </div>
          <h2 class="mb-2 text-xl font-bold dark:text-slate-100">
            Coming soon...
          </h2>
          <p class="mb-5 text-sm text-slate-400 dark:text-slate-500">
            This feature is not available yet.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
