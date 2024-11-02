<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/utils';
import { formatTimeAgo } from '@vueuse/core';

definePageMeta({
  title: 'Insights',
  group: 'reports',
  showInMenu: true,
  order: 2,
  icon: 'solar:layers-bold-duotone',
  packages: ['optima'],
  roles: ['administrator', 'ee_event_organizer'],
  capabilities: ['ee_read_insights'],
  permissions: ['ee_read_insights'],
  layout: 'dashboard-with-sidebar',
});

const { event, isLoading: isEventLoading, isError } = useEvent();

const eventId = computed(() => event.value?.id);

const getInsights = async (eventId: Ref<string>, signal: AbortSignal) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${eventId.value}/insights`, { signal });
  return response.data?.data;
};

const { data, refetch, isRefetching } = useQuery({
  queryKey: ['eventInsights', eventId],
  queryFn: ({ signal }) => getInsights( eventId, signal),
  enabled: !!eventId,
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
        <div v-if="isEventLoading || isRefetching" class="grid gap-4 grid-cols-12">
          <Skeleton v-for="i in 2" class="h-28 rounded-xl col-span-12 md:col-span-6 bg-muted-foreground/10" />
        </div>
        <div v-else-if="isError" class="py-16">
          <div class="flex h-32 items-center justify-center">
            Error fetching event insights. Please try again later.
          </div>
          <div class="flex h-32 items-center justify-center">
            <Button @click="refetch" class="mt-5"> Try Again </Button>
          </div>
        </div>
        <div class="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" v-else-if="data">
          <NuxtLink
            v-for="item in data"
            :key="item.id"
            :to="`/event/${eventId}/insights/${item.id}`"
            custom
            v-slot="{ href, navigate }"
          >
            <a :href="href" @click="navigate" class="group">
              <Card class="relative overflow-hidden group-hover:border-blue-600 transition-colors">
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="h4 text-sm font-medium tracking-normal">
                    {{ item.title }}
                  </CardTitle>

                  <DropdownEditMenu :eventId="eventId" :itemId="item.id" />
                </CardHeader>
                <CardContent class="flex flex-col space-y-2 pt-0 pb-0">
                  <div v-if="item.fields?.length" class="flex gap-2 flex-wrap">
                    <Badge variant="outline" v-for="question in item.fields" :key="question.id">
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
                    ></div>
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
      </div>
    </section>
  </div>
</template>
