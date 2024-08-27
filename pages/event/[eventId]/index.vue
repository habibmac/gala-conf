<script setup lang="ts">
import { formatValue } from "@/utils";

definePageMeta({
  title: 'Dashboard',
  group: 'dashboard',
  showInMenu: true,
  requiresSelectedEvent: true,
  icon: 'solar:widget-4-bold-duotone',
  packages: ['starter', 'smart', 'optima'],
  roles: ["administrator", "ee_event_organizer", "ee_event_operator"],
  capabilities: ['ee_read_registrations'],
  permissions: ['ee_read_registrations'],
  layout: 'dashboard-with-sidebar',
})

const { event, isLoading, isError, error } = useEvent();

const data1 = [
  {
    title: "New Today",
    data: {
      value: Math.random() * 100,
      change: 10,
      isCurrency: false,
    },
  },
  {
    title: "Approved Today",
    data: {
      value: Math.random() * 100,
      change: 10,
      isCurrency: false,
    },
  },
  {
    title: "Total Regs",
    data: {
      value: Math.random() * 100,
      change: 10,
      isCurrency: false,
    },
  },
  {
    title: "Total Revenue",
    data: {
      value: Math.random() * 100,
      change: 10,
      isCurrency: true,
    },
  },
];
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
    <div class="py-5" v-else-if="event">
      <h1
        class="font-semibold leading-snug tracking-tight text-slate-800 dark:text-slate-100 text-2xl py-10"
      >
        {{ event.title }}
      </h1>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card v-for="item in data1" :key="item.title">
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">
              {{ item.title }}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              class="h-4 w-4 text-muted-foreground"
            >
              <path
                d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ formatValue(item.data.value) }}
              <span
                class="text-xs font-medium text-muted-foreground"
                v-if="item.data.isCurrency"
              >
                IDR
              </span>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ item.data.change }}% change
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
