<!-- pages/event/[eventId]/registrations/[regId]/index.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';

import type { RegistrationDetails } from '~/types';

// Components
import AttendeeInfoCard from '@/components/partials/registrations/details/AttendeeInfo.vue';
import PaymentHistoryCard from '@/components/partials/registrations/details/PaymentHistory.vue';
import QuickActionsCard from '@/components/partials/registrations/details/QuickActions.vue';
import RegistrationAnswersCard from '@/components/partials/registrations/details/RegAnswers.vue';
import RegistrationInfoCard from '@/components/partials/registrations/details/RegInfo.vue';
import TransactionInfoCard from '@/components/partials/registrations/details/TransactionInfo.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Page meta
definePageMeta({
  layout: 'dashboard-with-sidebar',
  title: 'Registration Details',
  requiresSelectedEvent: true,
  showInMenu: false,
});

// Route and composables
// const route = useRoute();
const router = useRouter();
const route = useRoute();
const { $galantisApi } = useNuxtApp();

const eventId = computed(() => route.params.eventId as string);
const regId = computed(() => route.params.regId as string);

// Fetch registration details
const { data: registration, isLoading, isError, refetch } = useQuery({
  queryKey: ['registration-details', eventId.value, regId.value],
  queryFn: async () => {
    const response = await $galantisApi.get(`/event/${eventId.value}/registrations/${regId.value}`);
    return response.data as RegistrationDetails;
  },
  enabled: computed(() => !!eventId.value && !!regId.value),
});

// Tab counts for badges
const tabCounts = computed(() => {
  if (!registration.value)
    return {};

  return {
    payments: registration.value.pmt?.length || 0,
    answers: registration.value.ans?.filter(a => a.ans).length || 0,
  };
});

// Navigation
const goBack = () => {
  router.back();
};

// Head
useHead({
  title: computed(() =>
    registration.value
      ? `${registration.value.fullname} - Registration Details`
      : 'Registration Details',
  ),
});
</script>

<template>
  <div class="relative flex h-full flex-col md:flex-row">
    <aside class="static w-full md:w-auto">
      <div
        class="no-scrollbar shrink-0 overflow-y-auto overflow-x-hidden md:sticky md:top-16 md:h-[calc(100dvh-64px)] md:w-[350px] md:border-r md:border-slate-200 dark:md:border-slate-800 lg:w-[500px]"
      >
        <div class=" p-4 pt-8 md:pb-20">
          <Button
            variant="ghost"
            size="sm"
            class="mb-4 ml-4 hover:bg-muted-foreground/10"
            @click="goBack"
          >
            <Icon icon="heroicons:arrow-left" class="mr-2 size-4" />
            Back to Registrations
          </Button>
          <div class="mx-auto max-w-[400px]">
            <template v-if="isLoading">
              <Skeleton class="h-60 w-full bg-muted-foreground/20" />
            </template>
            <div v-else-if="registration" class="space-y-4 ">
              <!-- Details -->
              <RegistrationInfoCard :registration="registration" />
              <QuickActionsCard :registration="registration" />
            </div>
          </div>
        </div>
      </div>
    </aside>

    <div class="flex-1 overflow-y-auto">
      <div class="container mx-auto mb-20 max-w-2xl p-6">
        <section>
          <!-- Loading State -->
          <div v-if="isLoading" class="space-y-6">
            <div class="flex space-x-1 rounded-lg p-1">
              <Skeleton v-for="i in 4" :key="i" class="h-9 flex-1 bg-muted-foreground/10" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton class="h-6 w-32 bg-muted-foreground/20" />
              </CardHeader>
              <CardContent>
                <Skeleton class="h-40 w-full bg-muted-foreground/20" />
              </CardContent>
            </Card>
          </div>

          <!-- Error State -->
          <Card v-else-if="isError">
            <CardContent class="pt-6">
              <EmptyState
                icon="heroicons:exclamation-triangle"
                title="Oh no! Something went wrong."
                description="Please try again later or contact support."
                :cta="{ label: 'Try Again', action: refetch, icon: 'heroicons:arrow-path-solid' }"
              />
            </CardContent>
          </Card>

          <template v-else-if="registration">
            <Tabs default-value="overview" class="space-y-6">
              <TabsList class="grid w-full grid-cols-4 bg-muted-foreground/10">
                <TabsTrigger value="overview" class="flex items-center gap-2">
                  <Icon icon="heroicons:user" class="size-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="details" class="flex items-center gap-2">
                  <Icon icon="heroicons:information-circle" class="size-4" />
                  Details
                  <Badge v-if="tabCounts.answers" variant="secondary" class="ml-1">
                    {{ tabCounts.answers }}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="transaction" class="flex items-center gap-2">
                  <Icon icon="heroicons:credit-card" class="size-4" />
                  Transaction
                </TabsTrigger>
                <TabsTrigger value="payments" class="flex items-center gap-2">
                  <Icon icon="heroicons:banknotes" class="size-4" />
                  Payments
                  <Badge v-if="tabCounts.payments" variant="secondary" class="ml-1">
                    {{ tabCounts.payments }}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <!-- Overview Tab -->
              <TabsContent value="overview" class="space-y-6">
                <AttendeeInfoCard :registration="registration" />
              </TabsContent>
              <!-- Details Tab -->
              <TabsContent value="details" class="space-y-6">
                <RegistrationAnswersCard :registration="registration" />
              </TabsContent>

              <!-- Transaction Tab -->
              <TabsContent value="transaction" class="space-y-6">
                <TransactionInfoCard :registration="registration" />
              </TabsContent>

              <!-- Payments Tab -->
              <TabsContent value="payments" class="space-y-6">
                <PaymentHistoryCard :registration="registration" />
              </TabsContent>
            </Tabs>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>
