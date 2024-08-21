import { defineStore } from 'pinia'

interface AuthState {
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    userInfo: object | null;
    roles: string[];
    packages: string[];
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        userInfo: null,
        roles: [],
        packages: []
    }),
    actions: {
        setAuth(accessToken: string, refreshToken: string) {
            this.isAuthenticated = true
            this.accessToken = accessToken
            this.refreshToken = refreshToken
        },
        clearAuth() {
            this.isAuthenticated = false
            this.accessToken = null
            this.refreshToken = null
        },
        async refreshTokens() {
            const { $oauthApi } = useNuxtApp()

            try {
                const response = await $oauthApi.post('/token', {
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken,
                    client_id: useRuntimeConfig().public.oauthClientId,
                    client_secret: useRuntimeConfig().public.oauthClientSecret,
                })
                this.setAuth(response.data.access_token, response.data.refresh_token)
                return response.data.access_token
            } catch (error) {
                this.clearAuth()
                throw error
            }
        },

        async fetchUserInfo() {
            const { $oauthApi } = useNuxtApp()

            try {
                const response = await $oauthApi.get('/me')
                // Handle user info, e.g., set it in the store
                this.userInfo = response.data
            } catch (error) {
                console.error('Failed to fetch user info', error)
            }
        },

        hasAccess(roles?: string[], packages?: string[]) {
            if (!roles && !packages) return true;
            if (roles && roles.some(role => this.roles.includes(role))) return true;
            if (packages && packages.some(pkg => this.packages.includes(pkg))) return true;
            return false;
        },

        async logout() {
            const { $oauthApi } = useNuxtApp()

            try {
                await $oauthApi.post('/destroy', {
                    token: this.accessToken,
                })
            } catch (error) {
                console.error('Error during logout', error)
            } finally {
                this.clearAuth()
            }
        }
    }
})