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
  hasToken: !!testToken,
  tokenPrefix: testToken ? testToken.substring(0, 3) + '...' : 'NONE',
  runtimeConfigPublicKeys: Object.keys(runtimeConfig.public),
  apiUrl: runtimeConfig.public.apiUrl,
  oauthUrl: runtimeConfig.public.oauthUrl,
};

// Test 1: Direct request to WordPress
const testDirectRequest = async () => {
  loading.value = true;
  error.value = null;
  data.value = null;
  
  if (!testToken) {
    error.value = "No test token configured in public environment variables";
    loading.value = false;
    return;
  }
  
  try {
    // Direct fetch to WordPress using $fetch
    const response = await $fetch(`${runtimeConfig.public.oauthUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    data.value = response;
  } catch (e: any) {
    console.error('Direct request error:', e);
    error.value = e.data || e.message || String(e);
  } finally {
    loading.value = false;
  }
};

// Test 2: Via API proxy route
const testServerProxy = async () => {
  loading.value = true;
  error.value = null;
  data.value = null;
  
  if (!testToken) {
    error.value = "No test token configured in public environment variables";
    loading.value = false;
    return;
  }
  
  try {
    // Request through your Nuxt server API
    const response = await $fetch('/api/me', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    data.value = response;
  } catch (e: any) {
    console.error('Server API request error:', e);
    error.value = e.data || e.message || String(e);
  } finally {
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
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    data.value = response;
  } catch (e: any) {
    console.error('Debug request error:', e);
    error.value = e.data || e.message || String(e);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-8">
    <h2 class="text-2xl font-semibold mb-4">Authentication Test Page</h2>
    
    <div class="mt-4 p-4 border border-gray-500 rounded-md mb-4">
      <h3 class="font-medium mb-2">Runtime Config Debug:</h3>
      <pre class="text-sm overflow-auto">{{ JSON.stringify(configDebug, null, 2) }}</pre>
    </div>
    
    <div v-if="loading" class="my-4">
      <p>Loading...</p>
    </div>
    
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
      <p class="font-bold">Error</p>
      <pre class="text-sm overflow-auto">{{ JSON.stringify(error, null, 2) }}</pre>
    </div>
    
    <div v-if="data" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded my-4">
      <p class="font-bold">Success</p>
      <pre class="text-sm overflow-auto">{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
    
    <div v-if="!testToken" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded my-4">
      <p class="font-bold">Warning</p>
      <p>No test token configured in public environment variables. Set NUXT_PUBLIC_OAUTH_ACCESS_TOKEN_TEST in your environment.</p>
    </div>
    
    <div class="space-y-4">
      <div>
        <h3 class="font-medium mb-2">1. Direct WordPress Request</h3>
        <button 
          @click="testDirectRequest" 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="!testToken"
        >
          Test Direct Request
        </button>
      </div>
      
      <div>
        <h3 class="font-medium mb-2">2. Via Server API Proxy</h3>
        <button 
          @click="testServerProxy" 
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          :disabled="!testToken"
        >
          Test Server API Proxy
        </button>
      </div>
      
      <div>
        <h3 class="font-medium mb-2">3. Debug Request Headers</h3>
        <button 
          @click="testDebugRequest" 
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          :disabled="!testToken"
        >
          Test with Debugging
        </button>
      </div>
    </div>
  </div>
</template>