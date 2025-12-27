<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { PaperAnalytics } from '@/types/papers';
import { Icon } from '@iconify/vue';
import Card from '~/components/ui/card/Card.vue';
import CardContent from '~/components/ui/card/CardContent.vue';
import CardHeader from '~/components/ui/card/CardHeader.vue';
import CardTitle from '~/components/ui/card/CardTitle.vue';
import Skeleton from '~/components/ui/skeleton/Skeleton.vue';

useHead({
  title: 'Paper Analytics',
});

definePageMeta({
  capabilities: [],
  group: 'conf',
  icon: 'solar:chart-2-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 3,
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Analytics',
});

const route = useRoute();
const eventId = computed(() => route.params.eventId as string);

const { getPaperAnalytics, loading } = usePapers(eventId.value);
const analytics = ref<PaperAnalytics | null>(null);
const isInitialLoad = ref(true);

onMounted(async () => {
  try {
    analytics.value = await getPaperAnalytics();
  } catch (error) {
    console.error('Failed to load analytics:', error);
  } finally {
    isInitialLoad.value = false;
  }
});

const topicStats = computed(() => {
  if (!analytics.value) return [];
  return Object.entries(analytics.value.by_topic).map(([topic_id, count]) => ({
    topic_id,
    count,
  }));
});
</script>

<template>
  <div class="container mx-auto mb-20">
    <!-- Loading State -->
    <div v-if="isInitialLoad" class="space-y-6">
      <header class="mb-6 pt-10">
        <Skeleton class="h-10 w-48 mb-2" />
        <Skeleton class="h-5 w-96" />
      </header>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton v-for="i in 4" :key="i" class="h-32 rounded-lg" />
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="analytics" class="space-y-6">
      <!-- Header -->
      <header class="mb-6 pt-10">
        <div>
          <h1 class="h2 mb-2">
            Paper Analytics
          </h1>
          <p class="text-muted-foreground">
            Overview of paper submissions and review progress
          </p>
        </div>
      </header>

      <!-- Status Statistics -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="shrink-0">
                <div class="rounded-lg p-3 bg-gray-50 dark:bg-gray-900/20">
                  <Icon icon="heroicons:document-text-solid" class="h-6 w-6 text-gray-500" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-muted-foreground uppercase">
                    Submissions
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold tracking-tight text-foreground">
                      {{ analytics.total_submissions }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="shrink-0">
                <div class="rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20">
                  <Icon icon="heroicons:clock-solid" class="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-muted-foreground uppercase">
                    Pending
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold tracking-tight text-foreground">
                      {{ analytics.by_status.pending }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="shrink-0">
                <div class="rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                  <Icon icon="heroicons:eye-solid" class="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-muted-foreground uppercase">
                    Under Review
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold tracking-tight text-foreground">
                      {{ analytics.by_status.under_review }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="shrink-0">
                <div class="rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                  <Icon icon="heroicons:check-circle-solid" class="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-muted-foreground uppercase">
                    Accepted
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold tracking-tight text-foreground">
                      {{ analytics.by_status.accepted }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Submissions by Topic -->
      <Card>
        <CardHeader>
          <CardTitle>Submissions by Topic</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div v-for="topic in topicStats" :key="topic.topic_id" class="flex items-center justify-between">
              <span class="text-sm font-medium">{{ topic.topic_id }}</span>
              <div class="flex items-center gap-3">
                <div class="w-48 bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                  <div
                    class="bg-blue-600 h-2 rounded-full transition-all"
                    :style="{ width: `${(topic.count / analytics.total_submissions) * 100}%` }"
                  />
                </div>
                <span class="text-sm text-muted-foreground min-w-[3ch]">{{ topic.count }}</span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="topicStats.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <Icon icon="heroicons:chart-bar-solid" class="h-16 w-16 text-muted-foreground mb-4" />
            <h3 class="text-lg font-semibold mb-2">No data yet</h3>
            <p class="text-sm text-muted-foreground max-w-sm">
              Statistics will appear here once papers are submitted
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Submissions Over Time -->
      <Card>
        <CardHeader>
          <CardTitle>Submissions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div
              v-for="item in analytics.submissions_over_time"
              :key="item.date"
              class="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span class="text-sm">{{ new Date(item.date).toLocaleDateString() }}</span>
              <span class="text-sm font-medium">{{ item.count }} submissions</span>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="analytics.submissions_over_time.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <Icon icon="heroicons:calendar-solid" class="h-16 w-16 text-muted-foreground mb-4" />
            <h3 class="text-lg font-semibold mb-2">No timeline data</h3>
            <p class="text-sm text-muted-foreground max-w-sm">
              Submission timeline will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Error State -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <Icon icon="heroicons:exclamation-triangle-solid" class="h-24 w-24 text-muted-foreground mb-6" />
      <h2 class="text-2xl font-bold mb-2">Unable to load analytics</h2>
      <p class="text-muted-foreground mb-6 max-w-md">
        There was an error loading the analytics data
      </p>
    </div>
  </div>
</template>
