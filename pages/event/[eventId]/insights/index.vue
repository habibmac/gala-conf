<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/utils';
import { formatTimeAgo } from '@vueuse/core';

useHead({
  title: 'Insights',
});

definePageMeta({
  title: 'Insights',
  group: 'reports',
  showInMenu: true,
  order: 2,
  icon: 'solar:layers-bold-duotone',
  requiresSelectedEvent: true,
  packages: ['smart', 'optima'],
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  capabilities: ['ee_read_insights'],
  layout: 'dashboard-with-sidebar',
});

const { event, isLoading: isEventLoading } = useEvent();

const eventId = computed(() => event.value?.id);

const getInsights = async (eventId: Ref<string>, signal: AbortSignal) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${eventId.value}/insights`, { signal });
  return response.data?.data;
};

const {
  isLoading: isDataLoading,
  data,
  refetch,
  isRefetching,
  error,
} = useQuery({
  queryKey: ['eventInsights', eventId],
  queryFn: ({ signal }) => getInsights(eventId, signal),
  enabled: !!eventId.value,
  staleTime: 1000 * 60 * 5, // 5 minutes
});
</script>
<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-10">
      <h1 class="h2 mb-5">Insights</h1>
    </header>

    <section>
      <div>
        <div v-if="isEventLoading || isDataLoading || isRefetching" class="grid gap-4 grid-cols-12">
          <Skeleton v-for="i in 2" :key="i" class="h-28 rounded-xl col-span-12 md:col-span-6 bg-muted-foreground/10" />
        </div>
        <template v-else-if="data">
          <div v-if="data.length > 0" class="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
            <NuxtLink
              v-for="item in data"
              :key="item.id"
              v-slot="{ href, navigate }"
              :to="`/event/${eventId}/insights/${item.id}`"
              custom
            >
              <a :href="href" class="group" @click="navigate">
                <Card class="relative overflow-hidden group-hover:border-blue-600 transition-colors">
                  <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle class="h4 text-sm font-medium tracking-normal">
                      {{ item.title }}
                    </CardTitle>
                    <DropdownEditMenu :event-id="eventId" :item-id="item.id" />
                  </CardHeader>
                  <CardContent class="flex flex-col space-y-2 pt-0 pb-0">
                    <div v-if="item.fields?.length" class="flex gap-2 flex-wrap">
                      <Badge v-for="question in item.fields" :key="question.id" variant="outline">
                        <div class="text-xs">
                          {{ question.label }}
                        </div>
                      </Badge>
                    </div>
                    <div class="relative max-h-40 overflow-hidden">
                      <Separator class="my-4" label="Ticket Groups" />
                      <div v-if="item.groups?.length" class="grid rounded-lg gap-1">
                        <div v-for="ticket in item.groups" :key="ticket.id" class="">
                          <div class="text-sm border p-2 font-medium rounded-md">
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
                        class="sticky pointer-events-none bottom-0 h-10 bg-gradient-to-t from-white inset-0 dark:from-slate-900"
                      />
                    </div>
                  </CardContent>
                  <CardFooter class="flex text-xs justify-between text-slate-500">
                    <div class="flex flex-col gap-1">
                      <div>Created by</div>
                      <div class="flex items-center space-x-1">
                        <Avatar class="w-5 h-5">
                          <AvatarImage :src="item.avatar" />
                          <AvatarFallback>{{ getInitials(item.author) }}</AvatarFallback>
                        </Avatar>
                        <span class="text-slate-800 font-medium dark:text-slate-300">
                          {{ item.author }}
                        </span>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <div>Last modified</div>
                      <div class="text-slate-800 font-medium dark:text-slate-300">
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
