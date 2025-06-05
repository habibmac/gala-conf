<script setup lang="ts">
import { ref } from 'vue';

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Auth Test Page',
});

const loading = ref(false);
const data = ref<any>(null);
const error = ref<any>(null);

// Get the runtime config - now using public variables
const runtimeConfig = useRuntimeConfig();
const testToken = runtimeConfig.public.oauthAccessTokenTest || '';

// Debug information
const configDebug = {
  apiUrl: runtimeConfig.public.apiUrl,
  hasToken: !!testToken,
  oauthUrl: runtimeConfig.public.oauthUrl,
  runtimeConfigPublicKeys: Object.keys(runtimeConfig.public),
  token: testToken ? testToken.slice(-4) : 'No token',
};

// Test 1: Direct request to WordPress
const testDirectRequest = async () => {
  loading.value = true;
  error.value = null;
  data.value = null;

  if (!testToken) {
    error.value = 'No test token configured in public environment variables';
    loading.value = false;
    return;
  }

  try {
    // Direct fetch to WordPress using $fetch
    const response = await $fetch(`${runtimeConfig.public.oauthUrl}/me`, {
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });

    data.value = response;
  }
  catch (e: any) {
    console.error('Direct request error:', e);
    error.value = e.data || e.message || String(e);
  }
  finally {
    loading.value = false;
  }
};

// Test 2: Via API proxy route
const testServerProxy = async () => {
  loading.value = true;
  error.value = null;
  data.value = null;

  if (!testToken) {
    error.value = 'No test token configured in public environment variables';
    loading.value = false;
    return;
  }

  try {
    // Request through your Nuxt server API
    const response = await $fetch('/api/me', {
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });

    data.value = response;
  }
  catch (e: any) {
    console.error('Server API request error:', e);
    error.value = e.data || e.message || String(e);
  }
  finally {
    loading.value = false;
  }
};

// Test 3: Debug headers and request info
const testDebugRequest = async () => {
  loading.value = true;
  error.value = null;
  data.value = null;

  try {
    // Use debug endpoint to see what happens with the request
    const response = await $fetch('/api/debug-request', {
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });

    data.value = response;
  }
  catch (e: any) {
    console.error('Debug request error:', e);
    error.value = e.data || e.message || String(e);
  }
  finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-8">
    <h2 class="mb-4 text-2xl font-semibold">
      Authentication Test Page
    </h2>

    <div class="my-4 rounded-md border border-gray-500 p-4">
      <h3 class="mb-2 font-medium">
        Runtime Config Debug:
      </h3>
      <pre class="overflow-auto text-sm">{{ JSON.stringify(configDebug, null, 2) }}</pre>
    </div>

    <div v-if="loading" class="my-4">
      <p>Loading...</p>
    </div>

    <div v-if="error" class="my-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
      <p class="font-bold">
        Error
      </p>
      <pre class="overflow-auto text-sm">{{ JSON.stringify(error, null, 2) }}</pre>
    </div>

    <div v-if="data" class="my-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
      <p class="font-bold">
        Success
      </p>
      <pre class="overflow-auto text-sm">{{ JSON.stringify(data, null, 2) }}</pre>
    </div>

    <div v-if="!testToken" class="my-4 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
      <p class="font-bold">
        Warning
      </p>
      <p>No test token configured in public environment variables. Set NUXT_PUBLIC_OAUTH_ACCESS_TOKEN_TEST in your environment.</p>
    </div>

    <div class="space-y-4">
      <div>
        <h3 class="mb-2 font-medium">
          1. Direct WordPress Request
        </h3>
        <button
          class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          :disabled="!testToken"
          @click="testDirectRequest"
        >
          Test Direct Request
        </button>
      </div>

      <div>
        <h3 class="mb-2 font-medium">
          2. Via Server API Proxy
        </h3>
        <button
          class="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
          :disabled="!testToken"
          @click="testServerProxy"
        >
          Test Server API Proxy
        </button>
      </div>

      <div>
        <h3 class="mb-2 font-medium">
          3. Debug Request Headers
        </h3>
        <button
          class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          :disabled="!testToken"
          @click="testDebugRequest"
        >
          Test with Debugging
        </button>
      </div>
    </div>
  </div>
</template>
