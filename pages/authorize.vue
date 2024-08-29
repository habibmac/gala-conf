<script setup lang="ts">
import { useRoute, useRouter } from "nuxt/app";

import { useAuthStore } from "@/stores";
import SpinnerRing from "@/components/SpinnerRing.vue";

definePageMeta({
   title: "Authorize",
})

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

// Exchange the code for tokens
const exchangeCodeForTokens = async (code: string) => {
  try {
    await authStore.exchangeCodeForTokens(code);
    // Redirect to the main page after successful authentication
    router.replace('/my-events');
  } catch (error) {
    console.error("Failed to exchange code for tokens", error);
    // Redirect to login page if there's an error
    router.replace('/auth/login');
  }
};

// Check for the code in the URL and exchange it for tokens
onMounted(async () => {
  const code = route.query.code as string;
  if (code) {
    exchangeCodeForTokens(code);
  } else {
    // If there's no code, redirect to login
    router.replace('/auth/login');
  }
});
</script>
<template>
  <div
    class="max-w-9xl mx-auto w-full px-4 py-8 flex sm:px-6 lg:px-8 min-h-screen"
  >
    <div class="m-auto max-w-2xl">
      <div class="px-4 text-center">
        <SpinnerRing />
        <h1>Authenticating, please wait...</h1>
      </div>
    </div>
  </div>
</template>
