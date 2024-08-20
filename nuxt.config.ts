import path from 'path'
import fs from 'fs'

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  devServer: {
    host: process.env.NUXT_PUBLIC_HOST,
    https: {
      key: process.env.NUXT_PUBLIC_SSL_KEY,
      cert: process.env.NUXT_PUBLIC_SSL_CERT
    }
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL,
      oauthUrl: process.env.OAUTH_URL,
      oauthClientId: process.env.OAUTH_CLIENT_ID,
      oauthClientSecret: process.env.NUXT_OAUTH_CLIENT_SECRET,
      oauthRedirectUri: process.env.OAUTH_REDIRECT_URI,
    }
  },
  plugins: [
    '~/plugins/api.ts'
  ],
})
