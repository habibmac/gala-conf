// types/api.d.ts
import type { AxiosInstance } from 'axios';

declare module '#app' {
  interface NuxtApp {
    $oauthApi: AxiosInstance
    $galantisApi: AxiosInstance
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $oauthApi: AxiosInstance
    $galantisApi: AxiosInstance
  }
}

export interface ApiErrorResponse {
  error?: string
  message?: string
  errors?: Record<string, string[]>
  validation?: Record<string, string[]>
  debug?: unknown
}

export interface ApiError {
  response?: {
    status?: number
    statusText?: string
    data?: ApiErrorResponse
  }
  message?: string
}

export {};
