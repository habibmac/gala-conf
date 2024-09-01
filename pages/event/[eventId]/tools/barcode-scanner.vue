<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Icon } from "@iconify/vue";

definePageMeta({
  title: "Barcode Scanner",
  group: "tools",
  showInMenu: true,
  order: 1,
  icon: "solar:qr-code-bold-duotone",
  packages: ["optima"],
  roles: ["administrator", "ee_event_organizer"],
  capabilities: ["ee_read_checkins"],
  permissions: ["ee_read_checkins"],
  layout: "dashboard-with-sidebar",
});

const handlePaused = (isPaused: boolean) => {
  console.log("Paused: ", isPaused);
};

const isOpen = ref(false);

function closeModal() {
  isOpen.value = false;
}
function openModal() {
  isOpen.value = true;
}

function toggleModal() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="container mx-auto">
    <div
      class="flex flex-col sm:flex-row justify-between items-start pt-10 gap-5"
    >
      <header class="sm:grow">
        <h1 class="h2">Barcode Scanner</h1>
      </header>

      <div class="w-full sm:w-auto flex flex-col sm:items-end gap-4 sm:shrink-0">
        <div class="border rounded-lg sm:hidden py-4 text-center">
          <Button @click="toggleModal" variant="outline" :class="['mx-auto']">
            <Icon icon="heroicons:camera" class="w-5 h-5"></Icon>
            <span class="ml-2">Use camera as scanner</span>
          </Button>
        </div>
        <div class="hidden sm:block">
          <Button @click="toggleModal" variant="outline">
            <Icon :icon="isOpen ? 'ei:close' : 'heroicons:camera'"
             class="w-5 h-5"></Icon>
            <span class="ml-2">{{ 
              isOpen ? 'Close' : 'Use camera'
             }}</span>
          </Button>
        </div>
        <div
          class="relative mx-auto max-h-80 max-w-60 object-center object-cover"
          v-if="isOpen"
        >
          <TicketScanner @paused="handlePaused" />
        </div>
      </div>
    </div>
  </div>
</template>
