import { useAuthStore } from "~/stores/auth"

export default defineNuxtRouteMiddleware((to, from) => {
    const authStore = useAuthStore()

    if (to.path === '/events' && !authStore.isAuthenticated) {
        return navigateTo('/')
    }
})