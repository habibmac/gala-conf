<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from "@/stores";
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

const statuses = ref([
  'Booting up...',
  'Loading components...',
  'Painting the walls...',
]);

const statusIndex = ref(0);
const currentStatus = computed(() => statuses.value[statusIndex.value]);

let interval: NodeJS.Timeout | null = null;
let timeout: NodeJS.Timeout | null = null;

const updateStatus = () => {
  statusIndex.value = (statusIndex.value + 1) % statuses.value.length;
};

const startCycling = () => {
  let intervalTime = 400;
  interval = setInterval(updateStatus, intervalTime);
  timeout = setTimeout(() => {
    if (authStore.isAuthenticated) {
      router.replace('/my-events');
    } else {
      router.replace('/auth/login');
    }
  }, intervalTime * statuses.value.length);
};

onMounted(() => {
  startCycling();
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
  if (timeout) clearTimeout(timeout);
});

// Watch for authentication state changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    if (interval) clearInterval(interval);
    if (timeout) clearTimeout(timeout);
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