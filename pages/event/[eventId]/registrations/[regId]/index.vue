<!-- pages/event/[eventId]/registrations/[regId]/index.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { toast } from 'vue-sonner';

import type { RegistrationDetails } from '~/types';

// Components
import AttendeeInfoCard from '@/components/partials/registrations/details/AttendeeInfo.vue';
import NotesCard from '@/components/partials/registrations/details/NotesCard.vue';
import PaymentHistoryCard from '@/components/partials/registrations/details/PaymentHistory.vue';
import QuickActionsCard from '@/components/partials/registrations/details/QuickActions.vue';
import RegistrationAnswersCard from '@/components/partials/registrations/details/RegAnswers.vue';
import RegistrationInfoCard from '@/components/partials/registrations/details/RegInfo.vue';
import SpecialAttendeeCard from '@/components/partials/registrations/details/SpecialAttendeeCard.vue';
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
const { data: registration, isLoading, isError, error, refetch } = useQuery({
  queryKey: ['registration-details', eventId.value, regId.value],
  queryFn: async () => {
    try {
      const response = await $galantisApi.get(`/event/${eventId.value}/registrations/${regId.value}`);
      return response.data as RegistrationDetails;
    }
    catch (err: any) {
      // Handle specific API error responses
      if (err.response?.data?.error) {
        throw err.response.data;
      }
      throw err;
    }
  },
  enabled: computed(() => !!eventId.value && !!regId.value),
  retry: false, // Don't retry for registration not found or invalid ID errors
});

// Error details
const errorDetails = computed(() => {
  if (!error.value)
    return null;

  // Handle structured API errors
  const errorData = error.value as any;
  if (errorData.error && errorData.message) {
    return {
      type: errorData.error,
      message: errorData.message,
    };
  }

  // Handle generic errors
  return {
    type: 'unknown_error',
    message: 'An unexpected error occurred',
  };
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

// Handle updates from components
const handleUpdate = async () => {
  // Refetch the registration data to get the latest from backend
  await refetch();
};

// Handle attendee information save
const handleSaveAttendeeInfo = async (payload: any) => {
  if (!registration.value)
    return;

  try {
    await $galantisApi.put(
      `/event/${eventId.value}/registrations/${registration.value.id}`,
      payload,
    );

    toast.success('Attendee information updated successfully');
    // Refetch data to get latest state
    await refetch();
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to update attendee information');
    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
};

// Handle answers save
const handleSaveAnswers = async (payload: any) => {
  if (!registration.value)
    return;

  try {
    await $galantisApi.put(
      `/event/${eventId.value}/registrations/${registration.value.id}`,
      payload,
    );

    toast.success('Answers updated successfully');
    // Refetch data to get latest state
    await refetch();
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to update answers');
    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
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
            Go Back
          </Button>
          <div class="mx-auto max-w-[400px]">
            <template v-if="isLoading">
              <Skeleton class="h-60 w-full bg-muted-foreground/20" />
            </template>
            <div v-else-if="registration" class="space-y-4 ">
              <!-- Details -->
              <RegistrationInfoCard :registration="registration" />
              <SpecialAttendeeCard :registration="registration" @vip-updated="handleUpdate" />
              <NotesCard :registration="registration" @update-notes="handleUpdate" />
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
                v-if="errorDetails?.type === 'registration_not_found'"
                icon="heroicons:user-minus"
                title="Registration Not Found"
                description="This registration has been deleted or does not exist. It may have been removed from the group."
                :cta="{ label: 'Go Back', action: goBack, icon: 'heroicons:arrow-left' }"
                :cta2="{ label: 'View All Registrations', action: () => router.push(`/event/${eventId}/registrations`), icon: 'heroicons:users' }"
              />
              <EmptyState
                v-else-if="errorDetails?.type === 'invalid_registration_id'"
                icon="heroicons:identification"
                title="Invalid Registration"
                description="The registration ID format is invalid or missing."
                :cta="{ label: 'Go Back', action: goBack, icon: 'heroicons:arrow-left' }"
              />
              <EmptyState
                v-else
                icon="heroicons:exclamation-triangle"
                title="Something went wrong"
                :description="errorDetails?.message || 'Please try again later or contact support.'"
                :cta="{ label: 'Try Again', action: refetch, icon: 'heroicons:arrow-path-solid' }"
                :cta2="{ label: 'Go Back', action: goBack, icon: 'heroicons:arrow-left' }"
              />
            </CardContent>
          </Card>

          <template v-else-if="registration">
            <Tabs default-value="overview" class="space-y-6">
              <TabsList class="grid h-11 w-full grid-cols-4 bg-muted-foreground/10 px-1.5">
                <TabsTrigger value="overview" class="flex h-8 items-center gap-2">
                  <Icon icon="tabler:user" class="size-4" />
                  <span class="hidden sm:block">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="details" class="flex h-8 items-center gap-2">
                  <Icon icon="tabler:info-circle" class="size-4" />
                  <span class="hidden sm:block">Details</span>
                </TabsTrigger>
                <TabsTrigger value="transaction" class="flex h-8 items-center gap-2">
                  <Icon icon="tabler:credit-card" class="size-4" />
                  <span class="hidden sm:block">Transaction</span>
                </TabsTrigger>
                <TabsTrigger value="payments" class="flex h-8 items-center gap-2">
                  <Icon icon="tabler:wallet" class="size-4" />
                  <span class="hidden sm:block">Payments</span>
                  <Badge v-if="tabCounts.payments" variant="secondary" class="flex h-6 min-w-6 shrink-0 scale-90 items-center justify-center rounded-full px-1.5 text-xs">
                    {{ tabCounts.payments }}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <!-- Overview Tab -->
              <TabsContent value="overview" class="space-y-6">
                <AttendeeInfoCard
                  :registration="registration"
                  @save-attendee="handleSaveAttendeeInfo"
                />
              </TabsContent>
              <!-- Details Tab -->
              <TabsContent value="details" class="space-y-6">
                <RegistrationAnswersCard
                  :registration="registration"
                  @save-answers="handleSaveAnswers"
                />
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
