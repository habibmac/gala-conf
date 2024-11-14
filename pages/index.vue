<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '@/stores';
import { useRouter } from 'vue-router';
import { useLocalStorage } from '#imports';

const router = useRouter();
const authStore = useAuthStore();

const statuses = ['Booting up...', 'Loading components...', 'Painting the walls...'];

const currentStatus = ref(statuses[0]);
const loadingShown = useLocalStorage('loadingShown', false);

const timeouts: NodeJS.Timeout[] = [];

const showStatuses = () => {
  statuses.forEach((status, index) => {
    timeouts.push(
      setTimeout(
        () => {
          currentStatus.value = status;

          if (index === statuses.length - 1) {
            timeouts.push(
              setTimeout(() => {
                redirectBasedOnAuth();
                loadingShown.value = true;
              }, 1000)
            );
          }
        },
        index * 800 + Math.random() * 1000
      )
    );
  });
};

const redirectBasedOnAuth = () => {
  if (authStore.isAuthenticated) {
    router.replace('/my-events');
  } else {
    router.replace('/auth/login');
  }
};

onMounted(() => {
  if (!loadingShown.value) {
    showStatuses();
  } else {
    redirectBasedOnAuth();
  }
});

onUnmounted(() => {
  timeouts.forEach(clearTimeout);
});

// Watch for authentication state changes
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      timeouts.forEach(clearTimeout);
      router.replace('/my-events');
    }
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="!loadingShown" class="max-w-9xl mx-auto w-full px-4 py-8 flex sm:px-6 lg:px-8 min-h-screen">
    <div class="m-auto max-w-2xl">
      <div class="px-4 text-center">
        <SpinnerRing />
        <h1>{{ currentStatus }}</h1>
      </div>
    </div>
  </div>
</template>
