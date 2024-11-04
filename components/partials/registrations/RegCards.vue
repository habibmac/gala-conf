<script setup lang="ts">
import { formatThousands } from '@/utils';
import { useQuery } from '@tanstack/vue-query';
import { Icon } from '@iconify/vue';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const route = useRoute();
const eventId = ref(route.params.eventId as string) || ref('');

// Use queryClient to fetch data
const getEventSummary = async (evtId: Ref) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId.value}/summary`);
  return response.data;
};

const { data, isLoading, isError, refetch, isRefetching } = useQuery({
  queryKey: ['eventSummary', eventId],
  queryFn: () => getEventSummary(eventId),
  enabled: !!eventId,
});

const summaryData = computed(() => data?.value);
</script>

<template>
  <div v-if="isLoading || isRefetching" class="grid gap-4 grid-cols-12">
    <Skeleton v-for="i in 4" class="h-28 rounded-xl col-span-12 sm:col-span-6 md:col-span-3 bg-muted-foreground/10" />
  </div>
  <div v-else-if="isError" class="py-16">
    <div class="flex h-32 items-center justify-center">Error fetching event summary. Please try again later.</div>
  </div>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4" v-else-if="data">
    <Card v-for="item in summaryData" :key="item.title" class="relative overflow-hidden">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium tracking-normal">
          {{ item.title }}
        </CardTitle>
        <Button @click="refetch" variant="ghost" size="icon" class="group absolute top-3 right-3">
          <Icon
            icon="ri:refresh-line"
            class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:rotate-180 transition-transform dark:group-hover:text-slate-100"
            :class="{ 'animate-spin': isRefetching }"
          />
        </Button>
      </CardHeader>
      <CardContent class="relative">
        <div :class="cn('text-2xl font-semibold tabular-nums')">
          {{ formatThousands(item.value) }}
          <span class="text-xs font-medium text-muted-foreground" v-if="item.is_currency"> IDR </span>
        </div>
        <p class="text-xs text-muted-foreground" v-if="item.change">{{ item.change }}% change</p>
      </CardContent>
    </Card>
  </div>
</template>
