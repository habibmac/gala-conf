<script setup lang="ts">
import { useRoute, useRouter } from "nuxt/app";
import axios from "axios";

import { useAuthStore } from "@/stores/auth";
import SpinnerRing from "@/components/SpinnerRing.vue";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const code = route.query.code as string;

onMounted(async () => {
  const config = useRuntimeConfig();
  if (code) {
    try {
      const response = await axios.post(`${config.public.oauthUrl}/token`, {
        grant_type: "authorization_code",
        client_id: config.public.oauthClientId,
        client_secret: config.public.oauthClientSecret,
        code: code,
        redirect_uri: config.public.oauthRedirectUri,
      });
      authStore.setAuth(
        response.data.access_token,
        response.data.refresh_token
      );
      await authStore.fetchUserInfo();
      router.push("/events");
    } catch (error) {
      console.error("Authentication failed", error);
      router.push("/");
    }
  } else {
    router.push("/");
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
