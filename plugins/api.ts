// plugins/api.ts
import axios from 'axios'
import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '@/stores'

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()

    const oauthApi = axios.create({
        baseURL: config.public.oauthUrl,
    })

    const galantisApi = axios.create({
        baseURL: config.public.apiUrl,
    })

    let isRefreshing = false
    let failedQueue: Array<{
        resolve: (value?: unknown) => void
        reject: (reason?: any) => void
    }> = []

    const processQueue = (error: any, token: string | null = null) => {
        failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error)
            } else {
                prom.resolve(token)
            }
        })
        failedQueue = []
    }

    galantisApi.interceptors.request.use(
        (config) => {
            if (authStore.accessToken) {
                config.headers['Authorization'] = `Bearer ${authStore.accessToken}`
            }
            return config
        },
        (error) => Promise.reject(error)
    )

    galantisApi.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config
            if (error.response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    }).then(token => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`
                        return galantisApi(originalRequest)
                    }).catch(err => {
                        return Promise.reject(err)
                    })
                }

                originalRequest._retry = true
                isRefreshing = true

                try {
                    const { data } = await oauthApi.post("/token", {
                        grant_type: "refresh_token",
                        refresh_token: authStore.refreshToken,
                        client_id: config.public.oauthClientId,
                        client_secret: config.public.oauthClientSecret,
                    })
                    authStore.setAuth(data.access_token, data.refresh_token)
                    galantisApi.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
                    processQueue(null, data.access_token)

                    return galantisApi(originalRequest)

                } catch (refreshError) {
                    processQueue(refreshError, null)
                    authStore.clearAuth()
                    navigateTo('/auth/login')

                    return Promise.reject(refreshError)

                } finally {
                    isRefreshing = false
                }
            }
            return Promise.reject(error)
        }
    )

    return {
        provide: {
            oauthApi,
            galantisApi
        }
    }
})