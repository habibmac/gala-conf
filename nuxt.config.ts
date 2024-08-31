export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', "@nuxtjs/tailwindcss", "shadcn-nuxt", "@nuxt/eslint", '@vueuse/nuxt', '@nuxtjs/color-mode', 'nuxt-headlessui', '@nuxt/fonts'
  ],
  app: {
    head: {
      bodyAttrs: {
        class: 'font-inter antialiased text-slate-950 dark:text-slate-400'
      },
    },
  },
  build: {
    transpile: ['@vuepic/vue-datepicker']
  },
  css: [
    '~/assets/scss/main.scss'
  ],
  colorMode: {
    classSuffix: ''
  },
  fonts: {
    google: {
      families: [
        {
          name: 'Inter',
          styles: ['400', '500', '600', '700']
        }
      ]
    }
  },
  runtimeConfig: {
    oauthClientSecret: '',
    public: {
      apiUrl: '',
      oauthUrl: '',
      oauthClientId: '',
      oauthRedirectUri: '',
    }
  },
  plugins: [
    '~/plugins/api.ts'
  ],
})