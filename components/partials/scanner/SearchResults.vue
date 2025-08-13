<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationData } from '~/types';

import RegCode from '~/components/statuses/RegCode.vue';

interface Props {
  searchResults: RegistrationData[]
  unifiedInput: string
  isProcessing: boolean
  isSearching: boolean
}

defineProps<Props>();

defineEmits<{
  'select-result': [result: RegistrationData]
}>();
</script>

<template>
  <Card v-if="searchResults.length > 0 || isSearching || (unifiedInput && searchResults.length === 0 && !isProcessing)">
    <CardHeader class="flex w-full flex-row items-start justify-between">
      <CardTitle>Search Mode</CardTitle>
      <div v-if="searchResults.length > 0" class="text-sm  text-muted-foreground">
        Found {{ searchResults.length }} result{{ searchResults.length === 1 ? '' : 's' }}
      </div>
    </CardHeader>
    <CardContent class="p-0">
      <div class="space-y-4 p-6 pt-0">
        <!-- Search Results Display -->
        <div v-if="isSearching" class="flex flex-col items-center justify-center space-x-2">
          <Icon icon="svg-spinners:ring-resize" class="mx-auto mb-2 size-8 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">Searching...</span>
        </div>
        <div v-else-if="searchResults.length > 0" class="space-y-2">
          <div class="scroll-area -mx-6 -mb-6 max-h-96 space-y-2 overflow-y-auto px-6 pb-6">
            <div
              v-for="result in searchResults"
              :key="result.id"
              class="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
              :class="{
                'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20':
                  result.payment_validation && !result.payment_validation.can_checkin_payment,
              }"
              @click="$emit('select-result', result)"
            >
              <div class="space-y-6 sm:flex sm:items-center sm:justify-between sm:space-y-0">
                <div class="flex-1 space-y-1">
                  <div class="mt-1 flex items-center gap-2">
                    <!-- VIP Badge -->
                    <Badge
                      v-if="result.special_attendee?.is_vip"
                      class="bg-amber-500 text-xs text-white"
                    >
                      <Icon icon="solar:crown-bold" class="mr-1 size-2.5" />
                      VIP
                    </Badge>
                    <p class="text-sm font-medium">
                      {{ result.attendee.fullname }}
                    </p>
                  </div>

                  <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <RegCode
                      v-if="result.code"
                      :code="result.code"
                      size="xs"
                      class="w-fit whitespace-nowrap rounded-full border px-2 py-0.5 text-muted-foreground"
                    />
                    <p v-if="result.ticket?.name" class="text-sm font-medium">
                      {{ result.ticket.name }}
                    </p>
                  </div>

                  <div class="text-xs text-muted-foreground">
                    {{ result.attendee.email }}
                  </div>

                  <!-- Payment Status Warning -->
                  <div
                    v-if="result.payment_validation && !result.payment_validation.can_checkin_payment"
                    class="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
                  >
                    ⚠️ {{ result.payment_validation.payment_message }}
                  </div>
                </div>

                <div class="flex flex-col items-end gap-1">
                  <!-- Transaction Status Badge -->
                  <Badge v-if="!result.transaction.is_completed" variant="destructive" class="text-xs">
                    {{ result.transaction.status }}
                  </Badge>

                  <!-- Check-in Status Badge -->
                  <Badge :variant="result.can_checkin ? 'outline' : 'secondary'">
                    {{ result.checkin_status_text }}
                  </Badge>

                  <!-- Group registrations indicator -->
                  <div v-if="(result.group_registrations?.length ?? 0) > 0" class="text-xs text-muted-foreground">
                    +{{ result.group_registrations?.length ?? 0 }} group member{{
                      (result.group_registrations?.length ?? 0) === 1 ? '' : 's'
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Search Results -->
        <div
          v-else-if="unifiedInput.trim() && searchResults.length === 0 && !isProcessing"
          class="py-4 text-center text-muted-foreground"
        >
          <Icon icon="heroicons:magnifying-glass" class="mx-auto mb-2 size-8 opacity-50" />
          <p>No registrations found for "{{ unifiedInput }}"</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
