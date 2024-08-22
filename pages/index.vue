<script setup lang="ts">
import { useAuthStore } from "@/stores";

const router = useRouter();
const authStore = useAuthStore();

// If logged in, redirect to /my-events
if (authStore.isAuthenticated) {
  console.log('User is authenticated');
  router.push('/my-events');

} else {
  // If not logged in, redirect to /auth/login
  router.push('/auth/login');
}
</script>
<template>
  <div>
    Redirecting...
  </div>
</template>