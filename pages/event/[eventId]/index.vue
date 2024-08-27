<script setup lang="ts">
import { formatThousands } from "@/utils";
import { useQuery } from "@tanstack/vue-query";
import { Icon } from "@iconify/vue";
import SpinnerDots from "@/components/SpinnerDots.vue";

definePageMeta({
  title: "Dashboard",
  group: "dashboard",
  showInMenu: true,
  requiresSelectedEvent: true,
  icon: "solar:widget-4-bold-duotone",
  packages: ["starter", "smart", "optima"],
  roles: ["administrator", "ee_event_organizer", "ee_event_operator"],
  capabilities: ["ee_read_registrations"],
  permissions: ["ee_read_registrations"],
  layout: "dashboard-with-sidebar",
});

const { event, isLoading, isError } = useEvent();

// Use queryClient to fetch data
const getEventSummary = async (evtId: number) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId}/summary`);
  return response.data;
};

const { data, refetch, isRefetching } = useQuery({
  queryKey: ["event-summary", event.value?.id],
  queryFn: () => getEventSummary(event.value?.id),
  enabled: !!event.value,
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
  <div class="container mx-auto">
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
    <div class="py-5" v-else-if="event">
      <h1
        class="font-semibold leading-snug tracking-tight text-slate-800 dark:text-slate-100 text-2xl py-8"
      >
        Dashboard
      </h1>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card v-for="item in summaryData" :key="item.title" class="relative overflow-hidden">
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">
              {{ item.title }}
            </CardTitle>
          <Button @click="refetch" variant="ghost" size="icon" class="group absolute top-3 right-3">
             <Icon
              icon="heroicons-outline:refresh"
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
    </div>
  </div>
</template>
