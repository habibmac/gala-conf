<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

definePageMeta({
  title: "My Events",
  description: "List of active events",
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();

const { $galantisApi } = useNuxtApp();
const { data: evtCount } = useQuery({
  queryKey: ["events-count"],
  queryFn: () => $galantisApi.get("/events/count").then((res) => res.data),
  staleTime: 1000 * 60 * 60, // 1 hour
});

const activeTab = computed(() => route.query.status === "past" ? "past" : "active");

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
  const status = value === 'active' ? undefined : value.toString();
  router.push({ query: { status } });
};
</script>
<template>
  <div class="flex h-full w-full flex-col">
    <header class="mx-auto w-full max-w-4xl">
      <div class="px-4 py-10 sm:px-6 sm:pt-12">
        <div class="flex justify-between">
          <h1 class="h2">My Events</h1>
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
          <Tabs :model-value="activeTab">
            <TabsList class="mb-5">
              <TabsTrigger
                v-for="tab in tabsMeta"
                :key="tab.value"
                :value="tab.value"
                @click="handleTabChange(tab.value)"
              >
                <span>{{ tab.label }}</span>
                <Badge v-if="tab.count" :variant="tab.value === activeTab ? 'default' : 'outline'"  class="ml-2 flex text-xs h-6 min-w-6 px-1.5 shrink-0 items-center justify-center rounded-full">
                  {{ tab.count }}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent :value="activeTab">
              <EventsList :key="activeTab" :status="activeTab" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  </div>
</template>