<script setup lang="ts">
import { formatThousands } from "@/utils";
import { useQuery } from "@tanstack/vue-query";
import { Icon } from "@iconify/vue";

const { event, isLoading, isError } = useEvent();

const eventId = computed(() => event.value?.id);

// Use queryClient to fetch data
const getEventSummary = async (evtId: number) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId}/summary`);
  return response.data;
};

const { data, refetch, isRefetching } = useQuery({
  queryKey: ["eventSummary", eventId],
  queryFn: () => getEventSummary(eventId.value),
  enabled: !!eventId,
});

const summaryData = computed(() => data?.value);

watch(
  () => event.value,
  (newEvent) => {
    if (newEvent) {
      refetch();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="isLoading" class="py-16">
    <Skeleton class="h-8 w-1/2 mb-10" />
    <div class="grid gap-4 grid-cols-12">
      <Skeleton v-for="i in 4" class="h-[125px] rounded-xl col-span-3" />
      <Skeleton class="h-[400px] col-span-8 rounded-xl" />
      <Skeleton class="h-[400px] col-span-4 rounded-xl" />
    </div>
  </div>
  <div v-else-if="isError" class="py-16">
    <div class="flex h-32 items-center justify-center">
      Error fetching event summary. Please try again later.
    </div>
  </div>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4" v-else-if="event">
    <Card
      v-for="item in summaryData"
      :key="item.title"
      class="relative overflow-hidden"
    >
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle class="text-sm font-medium">
          {{ item.title }}
        </CardTitle>
        <Button
          @click="refetch"
          variant="ghost"
          size="icon"
          class="group absolute top-3 right-3"
        >
          <Icon
            icon="ri:refresh-line"
            class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:rotate-180 transition-transform dark:group-hover:text-slate-100"
            :class="{ 'animate-spin': isRefetching }"
          />
        </Button>
      </CardHeader>
      <CardContent class="relative">
        <div class="text-2xl font-bold number tabular">
          {{ formatThousands(item.value) }}
          <span
            class="text-xs font-medium text-muted-foreground"
            v-if="item.is_currency"
          >
            IDR
          </span>
        </div>
        <p class="text-xs text-muted-foreground" v-if="item.change">
          {{ item.change }}% change
        </p>
      </CardContent>
    </Card>
  </div>
</template>
