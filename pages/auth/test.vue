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

// Get the runtime config
const runtimeConfig = useRuntimeConfig();
// Access the test token from private runtime config
const testToken = runtimeConfig.oauthAccessTokenTest || '';

// Test 1: Direct request with hardcoded token
const testWithHardcodedToken = async () => {
  loading.value = true;
  error.value = null;
  data.value = null;
  
  if (!testToken) {
    error.value = "No test token configured in runtime config";
    loading.value = false;
    return;
  }
  
  try {
    // Direct fetch to WordPress using $fetch
    const response = await $fetch('https://galanesia.com/oauth/me', {
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

// Test 2: Test with direct token via server API
const testWithServerApi = async () => {
  loading.value = true;
  error.value = null;
  data.value = null;
  
  if (!testToken) {
    error.value = "No test token configured in runtime config";
    loading.value = false;
    return;
  }
  
  try {
    // Request through server API using the test token
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

// Test 3: Direct request with debugging info
const testWithDebugInfo = async () => {
  loading.value = true;
  error.value = null;
  data.value = null;
  
  if (!testToken) {
    error.value = "No test token configured in runtime config";
    loading.value = false;
    return;
  }
  
  try {
    // Use a server endpoint that will log and return request details
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
      <p>No test token configured in server environment. Set NUXT_OAUTH_ACCESS_TOKEN_TEST in Vercel environment variables.</p>
    </div>
    
    <div class="space-y-4">
      <div>
        <h3 class="font-medium mb-2">1. Direct WordPress Request</h3>
        <button 
          @click="testWithHardcodedToken" 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="!testToken"
        >
          Test Direct Request
        </button>
      </div>
      
      <div>
        <h3 class="font-medium mb-2">2. Via Server API</h3>
        <button 
          @click="testWithServerApi" 
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          :disabled="!testToken"
        >
          Test Server API
        </button>
      </div>
      
      <div>
        <h3 class="font-medium mb-2">3. Debug Request Headers</h3>
        <button 
          @click="testWithDebugInfo" 
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          :disabled="!testToken"
        >
          Test with Debugging
        </button>
      </div>
    </div>
  </div>
</template>