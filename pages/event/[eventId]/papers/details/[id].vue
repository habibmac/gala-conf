<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import type { Paper, Review } from '@/types/papers';
import { Icon } from '@iconify/vue';
import Card from '~/components/ui/card/Card.vue';
import CardContent from '~/components/ui/card/CardContent.vue';
import CardHeader from '~/components/ui/card/CardHeader.vue';
import CardTitle from '~/components/ui/card/CardTitle.vue';
import Skeleton from '~/components/ui/skeleton/Skeleton.vue';
import EmptyState from '~/components/EmptyState.vue';
import { Button } from '@/components/ui/button';
import Label from '~/components/ui/label/Label.vue';
import Select from '~/components/ui/select/Select.vue';
import SelectContent from '~/components/ui/select/SelectContent.vue';
import SelectItem from '~/components/ui/select/SelectItem.vue';
import SelectTrigger from '~/components/ui/select/SelectTrigger.vue';
import SelectValue from '~/components/ui/select/SelectValue.vue';

useHead({
  title: 'Paper Details',
});

definePageMeta({
  layout: 'dashboard-with-sidebar',
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: false, // Don't show in menu, accessed from papers list
});

const route = useRoute();
const router = useRouter();

const eventId = computed(() => route.params.eventId as string);
const paperId = computed(() => route.params.id as string);

const { getPaperDetails, getReviewsForPaper, assignReviewer, changePaperStatus, removePaperReviewer } = usePapers(eventId.value);

const newStatus = ref<PaperStatus | ''>('');

// Load paper data
const { data: paperData, isLoading: isPaperLoading, error: paperError, refetch: refetchPaper } = useQuery({
  enabled: !!paperId.value,
  queryFn: () => getPaperDetails(paperId.value),
  queryKey: ['paper', paperId],
});

// Load reviews data
const { data: reviewsData, isLoading: isReviewsLoading } = useQuery({
  enabled: !!paperId.value,
  queryFn: () => getReviewsForPaper(paperId.value),
  queryKey: ['paperReviews', paperId],
});

const paper = computed(() => paperData.value);
const reviews = computed(() => reviewsData.value || []);
const isLoading = computed(() => isPaperLoading.value || isReviewsLoading.value);

const handleAssignReviewer = async (reviewerId: string) => {
  try {
    await assignReviewer(paperId.value, reviewerId);
    await refetchPaper();
  } catch (error) {
    console.error('Failed to assign reviewer:', error);
  }
};

const handleRemoveReviewer = async (reviewerId: string) => {
  try {
    await removePaperReviewer(paperId.value, reviewerId);
    await refetchPaper();
  } catch (error) {
    console.error('Failed to remove reviewer:', error);
  }
};

const handleStatusChange = async (status: PaperStatus) => {
  if (!status) return;

  try {
    await changePaperStatus(paperId.value, status);
    await refetchPaper();
    newStatus.value = '';
  } catch (error) {
    console.error('Failed to change status:', error);
  }
};

const goBack = () => {
  router.back();
};
</script>

<template>
  <div v-if="isLoading" class="container mx-auto mb-20 pt-10">
    <Skeleton class="h-8 w-24 mb-4" />
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
      <div class="lg:col-span-2 space-y-6">
        <Skeleton class="h-96 w-full rounded-lg" />
        <Skeleton class="h-64 w-full rounded-lg" />
      </div>
      <div class="space-y-4">
        <Skeleton class="h-48 w-full rounded-lg" />
        <Skeleton class="h-32 w-full rounded-lg" />
      </div>
    </div>
  </div>

  <div v-else-if="paperError || !paper" class="container mx-auto mb-20 pt-20">
    <EmptyState
      title="Paper not found"
      description="The paper you're looking for doesn't exist or has been removed"
      icon="solar:document-text-bold-duotone"
      :cta="{ label: 'Go Back to Papers', action: goBack, icon: 'heroicons:arrow-left-solid' }"
    />
  </div>

  <template v-else-if="paper">
    <div class="container mx-auto mb-20">
      <div class="space-y-6">
      <!-- Header -->
      <header class="mb-6 pt-10">
        <Button
          variant="ghost"
          size="sm"
          @click="goBack"
          class="-ml-3"
        >
          <Icon icon="heroicons:arrow-left-solid" class="h-4 w-4 mr-2" />
          Back to Papers
        </Button>
      </header>

      <!-- Main Content -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left column: Paper Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Paper Details Card -->
          <PaperDetailsCard :paper="paper" />

          <!-- Reviews Section -->
          <Card>
            <CardHeader>
              <CardTitle>Reviews ({{ reviews.length }})</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="reviews.length > 0" class="space-y-4">
                <ReviewCard
                  v-for="review in reviews"
                  :key="review.review_id"
                  :review="review"
                />
              </div>
              <EmptyState v-else
                title="No Reviews Yet"
                description="This paper has not received any reviews yet."
                icon="solar:chat-comment-bold-duotone"
              />
            
            </CardContent>
          </Card>
        </div>

        <!-- Right column: Actions -->
        <div class="space-y-4">
          <!-- Reviewer Assignment -->
          <ReviewerAssignment
            :paper-id="paper.paper_id"
            :current-reviewers="paper.assigned_reviewers"
            @assign="handleAssignReviewer"
            @remove="handleRemoveReviewer"
          />

          <!-- Status Change -->
          <Card>
            <CardHeader>
              <CardTitle>Change Status</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="space-y-2">
                <Label class="text-xs">Current Status</Label>
                <div class="flex items-center gap-2">
                  <PaperStatusBadge :status="paper.current_status" />
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-xs">New Status</Label>
                <Select v-model="newStatus" :disabled="isLoading">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abstract_submitted">Abstract Submitted</SelectItem>
                    <SelectItem value="abstract_approved">Abstract Approved</SelectItem>
                    <SelectItem value="full_paper_submitted">Full Paper Submitted</SelectItem>
                    <SelectItem value="full_paper_accepted">Full Paper Accepted</SelectItem>
                    <SelectItem value="full_paper_rejected">Full Paper Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="default"
                :disabled="!newStatus || newStatus === paper.current_status || isLoading"
                @click="handleStatusChange(newStatus as PaperStatus)"
                class="w-full"
              >
                <span v-if="isLoading">Processing...</span>
                <span v-else>Update Status</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  </template>
</template>
