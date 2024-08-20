import axios from 'axios'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig()

    const oauthApi = axios.create({
        baseURL: config.public.oauthUrl,
    })

    const galantisApi = axios.create({
        baseURL: config.public.apiUrl,
    })

    galantisApi.interceptors.request.use(
        (config) => {
            const authStore = useAuthStore()
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
            if (error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true
                const authStore = useAuthStore()
                try {
                    const newAccessToken = await authStore.refreshTokens()
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
                    return galantisApi(originalRequest)
                } catch (refreshError) {
                    authStore.clearAuth()
                    navigateTo('/')
                    return Promise.reject(refreshError)
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