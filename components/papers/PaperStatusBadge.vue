<script setup lang="ts">
import type { Paper } from '@/types/papers';
import { Icon } from '@iconify/vue';
import Badge from '~/components/ui/badge/Badge.vue';

interface Props {
  status: PaperStatus
}

defineProps<Props>();

const statusConfig: Record<string, { label: string, variant: 'default', class: string, icon: string }> = {
  draft: {
    label: 'Draft',
    variant: 'default',
    class: 'bg-slate-100 text-slate-800 hover:bg-slate-100',
    icon: 'heroicons:pencil-square-solid',
  },
  abstract_submitted: {
    label: 'Abstract Submitted',
    variant: 'default',
    class: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    icon: 'heroicons:document-text-solid',
  },
  abstract_revision: {
    label: 'Abstract Revision',
    variant: 'default',
    class: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    icon: 'heroicons:arrow-path-solid',
  },
  abstract_approved: {
    label: 'Abstract Approved',
    variant: 'default',
    class: 'bg-green-100 text-green-800 hover:bg-green-100',
    icon: 'heroicons:check-circle-solid',
  },
  abstract_rejected: {
    label: 'Abstract Rejected',
    variant: 'default',
    class: 'bg-red-100 text-red-800 hover:bg-red-100',
    icon: 'heroicons:x-circle-solid',
  },
  full_paper_submitted: {
    label: 'Full Paper Submitted',
    variant: 'default',
    class: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    icon: 'heroicons:document-duplicate-solid',
  },
  full_paper_revision: {
    label: 'Full Paper Revision',
    variant: 'default',
    class: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    icon: 'heroicons:arrow-path-solid',
  },
  full_paper_accepted: {
    label: 'Full Paper Accepted',
    variant: 'default',
    class: 'bg-green-600 text-white hover:bg-green-600',
    icon: 'heroicons:check-badge-solid',
  },
  full_paper_rejected: {
    label: 'Full Paper Rejected',
    variant: 'default',
    class: 'bg-red-600 text-white hover:bg-red-600',
    icon: 'heroicons:x-circle-solid',
  },
  // Legacy support
  pending: {
    label: 'Pending',
    variant: 'default',
    class: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    icon: 'heroicons:clock-solid',
  },
  under_review: {
    label: 'Under Review',
    variant: 'default',
    class: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
    icon: 'heroicons:eye-solid',
  },
};
</script>

<template>
  <Badge :variant="statusConfig[status].variant" :class="statusConfig[status].class" class="inline-flex items-center gap-1">
    <Icon :icon="statusConfig[status].icon" class="h-4 w-4" />
    <span>{{ statusConfig[status].label }}</span>
  </Badge>
</template>
