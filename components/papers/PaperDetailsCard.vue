<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns';
import type { Paper } from '@/types/papers';
import { Icon } from '@iconify/vue';
import Badge from '~/components/ui/badge/Badge.vue';
import Card from '~/components/ui/card/Card.vue';
import CardContent from '~/components/ui/card/CardContent.vue';
import RegCode from '~/components/statuses/RegCode.vue';

interface Props {
  paper: Paper
}

defineProps<Props>();
</script>

<template>
  <Card>
    <CardContent class="p-6 space-y-6">
      <!-- Header -->
      <div class="space-y-2">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h1 class="text-2xl font-bold tracking-tight">{{ paper.title }}</h1>
            <p class="mt-2 text-sm text-muted-foreground">
              Paper ID: <span class="font-mono">{{ paper.paper_id }}</span>
            </p>
          </div>
          <PaperStatusBadge :status="paper.current_status" />
        </div>
        <p class="text-xs text-muted-foreground">
          Submitted {{ formatDistanceToNow(new Date(paper.submitted_at), { addSuffix: true }) }}
        </p>
      </div>

      <!-- Topic -->
      <div class="border-t pt-4">
        <h3 class="text-sm font-semibold text-muted-foreground">Topic</h3>
        <p class="mt-1 text-sm">{{ paper.topic.name }}</p>
      </div>

      <!-- Abstract -->
      <div class="border-t pt-4">
        <h3 class="text-sm font-semibold text-muted-foreground">Abstract</h3>
        <p class="mt-2 whitespace-pre-wrap text-sm">{{ paper.abstract }}</p>
      </div>

      <!-- Keywords -->
      <div v-if="paper.keywords?.length" class="border-t pt-4">
        <h3 class="text-sm font-semibold text-muted-foreground">Keywords</h3>
        <div class="mt-2 flex flex-wrap gap-2">
          <Badge v-for="keyword in paper.keywords" :key="keyword" variant="secondary">
            {{ keyword }}
          </Badge>
        </div>
      </div>

      <!-- Authors -->
      <div class="border-t pt-4">
        <h3 class="text-sm font-semibold text-muted-foreground mb-3">Authors</h3>
        <div class="space-y-2">
          <div v-for="author in paper.authors" :key="author.email" class="flex items-start justify-between rounded-lg border bg-card p-3">
            <div>
              <p class="text-sm font-medium">
                {{ author.name }}
                <Badge v-if="author.is_presenter" variant="default" class="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Presenter
                </Badge>
              </p>
              <p class="text-xs text-muted-foreground">{{ author.email }}</p>
              <p v-if="author.affiliation" class="text-xs text-muted-foreground">{{ author.affiliation }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Registration Information -->
      <div class="border-t pt-4">
        <h3 class="text-sm font-semibold text-muted-foreground mb-3">Registration Details</h3>
        <div class="rounded-lg border bg-card p-4 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Registrant</span>
            <span class="text-sm font-medium">{{ paper.registration.registrant_name }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Email</span>
            <span class="text-sm">{{ paper.registration.registrant_email }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Registration Code</span>
            <RegCode
              :code="paper.registration.registration_id"
              :status-id="paper.registration.registration_status_id"
              size="base"
            />
          </div>
          <div v-if="paper.registration.transaction_status_id" class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Transaction</span>
            <RegCode
              :code="paper.registration.registration_id"
              :status-id="paper.registration.transaction_status_id"
              size="sm"
            />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="paper.notes" class="border-t pt-4">
        <h3 class="text-sm font-semibold text-muted-foreground">Notes</h3>
        <p class="mt-2 whitespace-pre-wrap text-sm">{{ paper.notes }}</p>
      </div>
    </CardContent>
  </Card>
</template>
