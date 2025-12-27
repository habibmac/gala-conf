<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns';
import type { Review } from '@/types/papers';
import { Icon } from '@iconify/vue';
import Badge from '~/components/ui/badge/Badge.vue';
import Card from '~/components/ui/card/Card.vue';
import CardContent from '~/components/ui/card/CardContent.vue';

interface Props {
  review: Review
}

defineProps<Props>();

const recommendationConfig = {
  accept: { label: 'Accept', variant: 'default' as const, class: 'bg-green-100 text-green-800 hover:bg-green-100' },
  minor_revision: { label: 'Minor Revision', variant: 'default' as const, class: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  major_revision: { label: 'Major Revision', variant: 'default' as const, class: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  reject: { label: 'Reject', variant: 'default' as const, class: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

const getScoreLabel = (score: number) => {
  if (score >= 5) return 'Excellent';
  if (score >= 4) return 'Good';
  if (score >= 3) return 'Fair';
  return 'Poor';
};
</script>

<template>
  <Card>
    <CardContent class="p-5 space-y-4">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold">{{ review.reviewer?.name || 'Reviewer' }}</h3>
          <p class="text-xs text-muted-foreground">{{ review.reviewer?.email || review.reviewer_id }}</p>
        </div>
        <div class="flex flex-col items-end gap-1">
          <span class="text-xs text-muted-foreground">
            {{ formatDistanceToNow(new Date(review.submitted_at), { addSuffix: true }) }}
          </span>
          <Badge variant="outline" class="text-[10px] uppercase h-5">
            {{ review.phase }} v{{ review.version }}
          </Badge>
        </div>
      </div>

      <!-- Ratings -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Quality</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-sm font-medium">{{ getScoreLabel(review.quality_score) }}</span>
            <div class="flex gap-0.5">
              <Icon
                v-for="i in 5"
                :key="i"
                icon="heroicons:star-solid"
                class="h-3 w-3"
                :class="i <= review.quality_score ? 'text-yellow-400' : 'text-slate-200'"
              />
            </div>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Relevance</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-sm font-medium">{{ getScoreLabel(review.relevance_score) }}</span>
            <div class="flex gap-0.5">
              <Icon
                v-for="i in 5"
                :key="i"
                icon="heroicons:star-solid"
                class="h-3 w-3"
                :class="i <= review.relevance_score ? 'text-yellow-400' : 'text-slate-200'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendation -->
      <div>
        <p class="text-xs font-semibold text-muted-foreground mb-1">Recommendation</p>
        <Badge
          :variant="recommendationConfig[review.recommendation].variant"
          :class="recommendationConfig[review.recommendation].class"
        >
          {{ recommendationConfig[review.recommendation].label }}
        </Badge>
      </div>

      <!-- Comments -->
      <div class="border-t pt-4">
        <p class="text-xs font-semibold text-muted-foreground mb-2">Comments</p>
        <p class="whitespace-pre-wrap text-sm">{{ review.comments }}</p>
      </div>
    </CardContent>
  </Card>
</template>
