<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/vue';

definePageMeta({
  title: 'Ticket Scanner',
  group: 'tools',
  showInMenu: true,
  order: 1,
  icon: 'solar:qr-code-bold-duotone',
  requiresSelectedEvent: true,
  packages: ['optima'],
  roles: ['administrator', 'ee_event_organizer'],
  capabilities: ['ee_read_checkins'],
  layout: 'dashboard-with-sidebar',
});

const handlePaused = (isPaused: boolean) => {
  console.log('Paused: ', isPaused);
};

const isOpen = ref(false);

function toggleModal() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="container mx-auto">
    <div class="flex flex-col sm:flex-row justify-between items-start pt-10 gap-5">
      <header class="sm:grow">
        <h1 class="h2">Ticket Scanner</h1>
      </header>

      <div class="w-full sm:w-auto flex flex-col sm:items-end gap-4 sm:shrink-0">
        <div class="border rounded-lg sm:hidden py-4 text-center">
          <Button variant="outline" :class="['mx-auto']" @click="toggleModal">
            <Icon icon="heroicons:camera" class="w-5 h-5" />
            <span class="ml-2">Use camera as scanner</span>
          </Button>
        </div>
        <div class="hidden sm:block">
          <Button variant="outline" @click="toggleModal">
            <Icon :icon="isOpen ? 'ei:close' : 'heroicons:camera'" class="w-5 h-5" />
            <span class="ml-2">{{ isOpen ? 'Close' : 'Use camera' }}</span>
          </Button>
        </div>
        <div v-if="isOpen" class="relative mx-auto max-h-80 max-w-60 object-center object-cover">
          <BarQrScanner @paused="handlePaused" />
        </div>
      </div>
    </div>
  </div>
</template>
