export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', "@nuxtjs/tailwindcss", "shadcn-nuxt", "@nuxt/eslint", '@vueuse/nuxt', '@nuxtjs/color-mode', 'nuxt-headlessui'
  ],
  css: [
    '~/assets/scss/main.scss'
  ],
  colorMode: {
    classSuffix: ''
  },
  app: {
    head: {
      bodyAttrs: {
        class: 'font-inter antialiased bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
      },
    },
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL,
      oauthUrl: process.env.OAUTH_URL,
      oauthClientId: process.env.OAUTH_CLIENT_ID,
      oauthClientSecret: process.env.OAUTH_CLIENT_SECRET,
      oauthRedirectUri: process.env.OAUTH_REDIRECT_URI,
    }
  },
  plugins: [
    '~/plugins/api.ts'
  ],
})