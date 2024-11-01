<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores';
import { useRouter } from '#app';

useHead({
  title: 'Logging out...',
});

const authStore = useAuthStore();
const router = useRouter();

const seconds = ref(3); // Increased to 5 seconds
const dotsTimer = ref(0);

async function performLogout() {
  await authStore.logout();
}

async function artificialDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

onMounted(async () => {
  const logoutPromise = performLogout();

  const interval = setInterval(() => {
    seconds.value--;
    if (seconds.value === 0) {
      clearInterval(interval);
    }
  }, 1000);

  const dotsInterval = setInterval(() => {
    dotsTimer.value++;
  }, 500);

  // Wait for both the logout to complete and the artificial delay
  await Promise.all([
    logoutPromise,
    artificialDelay(3000), // 5 second delay
  ]);

  clearInterval(interval);
  clearInterval(dotsInterval);

  router.replace('/auth/login?loggedout=true');
});
</script>

<template>
  <div class="max-w-9xl mx-auto w-full px-4 py-8 flex sm:px-6 lg:px-8 min-h-screen">
    <div class="m-auto max-w-2xl">
      <div class="px-4 text-center">
        <SpinnerRing />
        <h1>Logging out...</h1>
        <p class="py-4 text-center text-muted-foreground text-sm">
          You will be redirected in
          <span class="font-medium dark:text-slate-300">{{ seconds }}</span>
          seconds.
        </p>
      </div>
    </div>
  </div>
</template>
