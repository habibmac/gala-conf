<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

definePageMeta({
  title: "My Events",
  description: "List of active events",
  layout: "dashboard",
});

const router = useRouter();

const { $galantisApi, $router } = useNuxtApp();
const { data: evtCount } = useQuery({
  queryKey: ["events-count"],
  queryFn: () => $galantisApi.get("/events/count").then((res) => res.data),
  staleTime: 1000 * 60 * 60, // 1 hour
});

const activeTab = computed(() =>
  $router.currentRoute.value.query.status === "past" ? "past" : "active"
);

const tabsMeta = computed(() => [
  {
    value: "active",
    label: "Active",
    count: evtCount.value?.active,
    link: "/my-events",
  },
  {
    value: "past",
    label: "Past",
    count: evtCount.value?.inactive,
    link: "/my-events?status=past",
  },
]);

const handleTabChange = (value: string) => {
  const status = value === "active" ? undefined : value.toString();
  router.push({ query: { status } });
};

const translationClass = computed(() => {
  return activeTab.value === "past" ? "translate-x-full" : "translate-x-0";
});
</script>
<template>
  <div class="flex h-full w-full flex-col">
    <header class="mx-auto w-full max-w-4xl">
      <div class="px-4 py-10 sm:px-6 sm:pt-12">
        <div class="flex justify-between">
          <h1 class="text-2xl font-semibold tracking-tight">My Events</h1>
          <div class="flex items-center space-x-2">
            <Button as-child>
              <NuxtLink to="/new-event"> Create New </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </header>
    <section>
      <div class="mx-auto sm:max-w-4xl">
        <div class="px-4 py-4 sm:px-6 sm:py-6">
          <div class="flex mb-6">
            <div
              class="relative flex w-full max-w-sm p-1 bg-slate-200 dark:bg-slate-700/40 rounded-md mx-auto sm:mx-0"
            >
              <span
                class="absolute inset-0 m-1 pointer-events-none"
                aria-hidden="true"
              >
                <span
                  class="absolute inset-0 w-1/2 bg-white dark:bg-slate-950/70 rounded-md transition-transform duration-150 ease-in-out"
                  :class="translationClass"
                ></span>
              </span>
              <template v-for="tab in tabsMeta" :key="tab.value">
                <button
                  class="relative flex-1 justify-center items-center z-20 flex text-sm font-medium p-1 duration-150 ease-in-out"
                  :class="tab.value === activeTab && 'dark:text-slate-100'"
                  @click.prevent="handleTabChange(tab.value)"
                >
                  {{ tab.label }}
                  <Badge
                    v-if="tab.count"
                    :variant="tab.value === activeTab ? 'default' : 'outline'"
                    class="ml-2 scale-90 flex text-xs h-6 min-w-6 px-1.5 shrink-0 items-center justify-center rounded-full"
                  >
                    {{ tab.count }}
                  </Badge>
                </button>
              </template>
            </div>
          </div>
          <EventsList :key="activeTab" :status="activeTab" />
        </div>
      </div>
    </section>
  </div>
</template>
