<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

useHead({
  meta: [{ content: 'List of active events', name: 'description' }],
  title: 'My Events',
});

definePageMeta({
  layout: 'dashboard',
});

const router = useRouter();

const { $galantisApi, $router } = useNuxtApp();
const { data: evtCount } = useQuery({
  queryFn: () => $galantisApi.get('/events/count?nocache=1').then(res => res.data),
  queryKey: ['events-count'],
  staleTime: 1000 * 60 * 60, // 1 hour
});

const activeTab = computed(() => ($router.currentRoute.value.query.status === 'past' ? 'past' : 'active'));

const tabsMeta = computed(() => [
  {
    count: evtCount.value?.active,
    label: 'Active',
    link: '/my-events',
    value: 'active',
  },
  {
    count: evtCount.value?.inactive,
    label: 'Past',
    link: '/my-events?status=past',
    value: 'past',
  },
]);

const handleTabChange = (value: string) => {
  const status = value === 'active' ? undefined : value.toString();
  router.push({ query: { status } });
};

const translationClass = computed(() => {
  return activeTab.value === 'past' ? 'translate-x-full' : 'translate-x-0';
});
</script>

<template>
  <div class="flex size-full flex-col">
    <header class="mx-auto w-full max-w-4xl">
      <div class="px-4 py-10 sm:px-6 sm:pt-12">
        <div class="flex justify-between">
          <h1 class="h2 text-2xl font-semibold tracking-tight">
            My Events
          </h1>
          <div class="flex items-center space-x-2">
            <Button as-child>
              <NuxtLink to="/new-event">
                <Icon icon="heroicons:plus" class="mr-2 size-5" />
                Create New Event ⚡️
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </header>
    <section>
      <div class="mx-auto sm:max-w-4xl">
        <div class="p-4 sm:p-6">
          <div class="mb-6 flex">
            <div class="relative mx-auto flex w-full max-w-sm rounded-md bg-muted-foreground/10 p-1 sm:mx-0">
              <span class="pointer-events-none absolute inset-0 m-1" aria-hidden="true">
                <span
                  class="absolute inset-0 w-1/2 rounded-md bg-card transition-transform duration-150 ease-in-out"
                  :class="translationClass"
                />
              </span>
              <template v-for="tab in tabsMeta" :key="tab.value">
                <button
                  class="relative z-10 flex flex-1 items-center justify-center p-1 text-sm font-medium duration-150 ease-in-out"
                  @click.prevent="handleTabChange(tab.value)"
                >
                  {{ tab.label }}
                  <Badge
                    v-if="tab.count"
                    :variant="tab.value === activeTab ? 'default' : 'outline'"
                    class="ml-2 flex h-6 min-w-6 shrink-0 scale-90 items-center justify-center rounded-full px-1.5 text-xs"
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
