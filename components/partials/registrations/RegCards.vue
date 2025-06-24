<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatThousands } from '@/utils';

defineProps<{
  forDashboard?: boolean
}>();

const route = useRoute();
const eventId = computed(() => route.params.eventId as string || '');

// Use queryClient to fetch data
const getEventSummary = async (evtId: Ref) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId.value}/registrations/summary`);
  return response.data;
};

const { data, isError, isLoading, isRefetching, refetch } = useQuery({
  enabled: !!eventId.value,
  queryFn: () => getEventSummary(eventId),
  queryKey: ['eventSummary', eventId],
});
</script>

<template>
  <div
    v-if="isLoading || isRefetching"
    :class="cn(
      'grid gap-4',
      forDashboard ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4',
    )"
  >
    <Skeleton v-for="i in 4" :key="i" class="h-32 rounded-xl bg-muted-foreground/10" />
  </div>
  <div v-else-if="isError" class="py-16">
    <div class="flex h-32 items-center justify-center">
      Error fetching event summary. Please try again later.
    </div>
  </div>
  <div
    v-else-if="data.length > 0"
    :class="cn(
      'grid gap-4',
      forDashboard ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4',
    )"
  >
    <Card v-for="item in data" :key="item.title" class="relative h-32 overflow-hidden">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Button
          variant="ghost"
          size="icon"
          class="group absolute right-3 top-3"
          @click="refetch"
        >
          <Icon
            icon="ri:refresh-line"
            class="size-3.5 text-slate-400 transition-transform group-hover:rotate-180 group-hover:text-slate-800 dark:group-hover:text-slate-100"
            :class="{ 'animate-spin': isRefetching }"
          />
        </Button>
      </CardHeader>
      <CardContent class="relative">
        <div
          :class="cn('text-2xl font-semibold ordinal slashed-zero',
                     item.key === 'approved_total' ? 'text-emerald-500' : 'text-foreground',
          )"
        >
          {{ formatThousands(item.value) }}
          <span v-if="item.is_currency" class="text-xs font-medium text-muted-foreground"> IDR </span>
        </div>
        <CardTitle class="text-sm font-medium tracking-normal">
          <NuxtLink v-if="forDashboard" :to="`/event/${eventId}/registrations`" class="hover:underline">
            {{ item.title }}
          </NuxtLink>
          <span v-else>{{ item.title }}</span>
        </CardTitle>
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
