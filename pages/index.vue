<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from "@/stores";
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

const statuses = [
  'Booting up...',
  'Loading components...',
  'Painting the walls...',
];
const currentStatus = ref(statuses[0]);
let timeouts: NodeJS.Timeout[] = [];

const showStatuses = () => {
  statuses.forEach((status, index) => {
    timeouts.push(setTimeout(() => {
      currentStatus.value = status;
      
      // If it's the last status, redirect after a short delay
      if (index === statuses.length - 1) {
        timeouts.push(setTimeout(() => {
          if (authStore.isAuthenticated) {
            router.replace('/my-events');
          } else {
            router.replace('/auth/login');
          }
        }, 1000)); // Wait 1 second after the last status before redirecting
      }
      // Show each status for random time between 0.5 and 1.5 seconds
    }, index * 800 + Math.random() * 1000));
  });
};

onMounted(() => {
  showStatuses();
});

onUnmounted(() => {
  timeouts.forEach(clearTimeout);
});

// Watch for authentication state changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    timeouts.forEach(clearTimeout);
    router.replace('/my-events');
  }
}, { immediate: true });
</script>

<template>
  <div class="max-w-9xl mx-auto w-full px-4 py-8 flex sm:px-6 lg:px-8 min-h-screen">
    <div class="m-auto max-w-2xl">
      <div class="px-4 text-center">
        <SpinnerRing />
        <h1>{{ currentStatus }}</h1>
      </div>
    </div>
  </div>
</template>