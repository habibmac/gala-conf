<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatThousands } from '@/utils';

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');

// Use queryClient to fetch data
const getEventSummary = async (evtId: Ref) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId.value}/summary`);
  return response.data;
};

const { data, isError, isLoading, isRefetching, refetch } = useQuery({
  enabled: !!eventId,
  queryFn: () => getEventSummary(eventId),
  queryKey: ['eventSummary', eventId],
});
</script>

<template>
  <div v-if="isLoading || isRefetching" class="grid grid-cols-12 gap-4">
    <Skeleton
      v-for="i in 4"
      :key="i"
      class="col-span-12 h-28 rounded-xl bg-muted-foreground/10 sm:col-span-6 md:col-span-3"
    />
  </div>
  <div v-else-if="isError" class="py-16">
    <div class="flex h-32 items-center justify-center">
      Error fetching event summary. Please try again later.
    </div>
  </div>
  <template v-else-if="data">
    <div v-if="data.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card v-for="item in data" :key="item.title" class="relative overflow-hidden">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium tracking-normal">
            {{ item.title }}
          </CardTitle>
          <Button variant="ghost" size="icon" class="group absolute right-3 top-3" @click="refetch">
            <Icon
              icon="ri:refresh-line"
              class="size-3.5 text-slate-400 transition-transform group-hover:rotate-180 group-hover:text-slate-800 dark:group-hover:text-slate-100"
              :class="{ 'animate-spin': isRefetching }"
            />
          </Button>
        </CardHeader>
        <CardContent class="relative">
          <div :class="cn('text-2xl font-semibold ordinal slashed-zero tabular-nums')">
            {{ formatThousands(item.value) }}
            <span v-if="item.is_currency" class="text-xs font-medium text-muted-foreground"> IDR </span>
          </div>
          <p v-if="item.change" class="text-xs text-muted-foreground">
            {{ item.change }}% change
          </p>
        </CardContent>
      </Card>
    </div>
    <div v-else class="mx-auto w-full">
      <EmptyState
        title="No data available"
        description="There is no data available for this event."
        :img="{ src: '/images/empty-state/no-data.svg', alt: 'No data' }"
      />
    </div>
  </template>
  <template v-else>
    <div class="mx-auto w-full">
      <EmptyState
        title="No data available"
        description="There is no data available for this event."
        :img="{ src: '/images/empty-state/no-data.svg', alt: 'No data' }"
      />
    </div>
  </template>
</template>
