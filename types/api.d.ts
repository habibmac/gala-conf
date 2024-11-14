// types/api.d.ts
import type { AxiosInstance } from 'axios';

declare module '#app' {
  interface NuxtApp {
    $oauthApi: AxiosInstance;
    $galantisApi: AxiosInstance;
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $oauthApi: AxiosInstance;
    $galantisApi: AxiosInstance;
  }
}

export {};
