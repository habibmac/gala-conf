<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { formatTimeAgo } from '@vueuse/core';

import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/utils';

useHead({
  title: 'Insights',
});

definePageMeta({
  capabilities: ['ee_read_insights'],
  group: 'reports',
  icon: 'solar:layers-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 2,
  packages: ['smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Insights',
});

const route = useRoute();
const eventId = computed(() => route.params.eventId as string || '');

const getInsights = async (eventId: Ref<string>, signal: AbortSignal) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${eventId.value}/insights`, { signal });
  return response.data;
};

const {
  data,
  error,
  isLoading: isDataLoading,
  isRefetching,
  refetch,
} = useQuery({
  enabled: !!eventId.value,
  queryFn: ({ signal }) => getInsights(eventId, signal),
  queryKey: ['eventInsights', eventId],
  staleTime: 1000 * 60 * 5, // 5 minutes
});
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-10">
      <h1 class="h2 mb-5">
        Insights
      </h1>
    </header>

    <section>
      <div>
        <div v-if="isDataLoading || isRefetching" class="grid grid-cols-12 gap-4">
          <Skeleton v-for="i in 2" :key="i" class="col-span-12 h-28 rounded-xl bg-muted-foreground/10 md:col-span-6" />
        </div>
        <template v-else-if="data">
          <div v-if="data.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <NuxtLink
              v-for="item in data"
              :key="item.id"
              v-slot="{ href, navigate }"
              :to="`/event/${eventId}/insights/${item.id}`"
              custom
            >
              <a :href="href" class="group" @click="navigate">
                <Card class="relative overflow-hidden transition-colors group-hover:border-blue-600">
                  <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="h4 text-sm font-medium tracking-normal">
                      {{ item.title }}
                    </CardTitle>
                    <DropdownEditMenu :event-id="eventId" :item-id="item.id" />
                  </CardHeader>
                  <CardContent class="flex flex-col space-y-2 py-0">
                    <div v-if="item.fields?.length" class="flex flex-wrap gap-2">
                      <Badge v-for="question in item.fields" :key="question.id" variant="outline">
                        <div class="text-xs">
                          {{ question.label }}
                        </div>
                      </Badge>
                    </div>
                    <div class="relative max-h-40 overflow-hidden">
                      <Separator class="my-4" label="Ticket Groups" />
                      <div v-if="item.groups?.length" class="grid gap-1 rounded-lg">
                        <div v-for="ticket in item.groups" :key="ticket.id" class="">
                          <div class="rounded-md border p-2 text-sm font-medium">
                            {{ ticket.name }}
                            <template v-if="ticket.tickets?.length">
                              <div v-for="subTicket in ticket.tickets" :key="subTicket.id">
                                <div class="text-xs text-slate-500 dark:text-slate-400">
                                  {{ subTicket.name }}
                                </div>
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>
                      <div
                        class="pointer-events-none sticky inset-0 h-10 bg-gradient-to-t from-white dark:from-slate-900"
                      />
                    </div>
                  </CardContent>
                  <CardFooter class="flex justify-between text-xs text-slate-500">
                    <div class="flex flex-col gap-1">
                      <div>Created by</div>
                      <div class="flex items-center space-x-1">
                        <Avatar class="size-5">
                          <AvatarImage :src="item.avatar" />
                          <AvatarFallback>{{ getInitials(item.author) }}</AvatarFallback>
                        </Avatar>
                        <span class="font-medium text-slate-800 dark:text-slate-300">
                          {{ item.author }}
                        </span>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <div>Last modified</div>
                      <div class="font-medium text-slate-800 dark:text-slate-300">
                        {{ formatTimeAgo(new Date(item.last_modified)) }}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </a>
            </NuxtLink>
          </div>
          <div v-else class="m-auto my-16 max-w-md">
            <EmptyState
              title="No Insights Found"
              description="Create your first insight to get started."
              :img="{
                src: '/images/empty-state/no-insight.svg',
                alt: 'No Insights Found',
                class: 'w-28',
              }"
              :cta="{
                label: 'Create Insight',
                to: `/event/${eventId}/insights/create`,
                icon: 'heroicons-outline:plus',
              }"
              :cta2="{ label: 'Refresh', action: refetch }"
            />
          </div>
        </template>
        <template v-else>
          <EmptyState
            title="Something went wrong"
            :description="
              error?.message || 'We are unable to fetch the insights at the moment. Please try again later.'
            "
            :cta="{ label: 'Try Again', icon: 'heroicons-outline:refresh', action: refetch }"
          />
        </template>
      </div>
    </section>
  </div>
</template>
