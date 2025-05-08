import pkg from './package.json';

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    'nuxt-headlessui',
    '@nuxt/fonts',
    '@vee-validate/nuxt',
    '@formkit/auto-animate/nuxt',
    '@nuxt/image',
  ],
  app: {
    head: {
      bodyAttrs: {
        class: 'font-geist',
      },
    },
  },
  build: {
    transpile: ['@vuepic/vue-datepicker'],
  },
  css: ['~/assets/scss/main.scss'],
  colorMode: {
    classSuffix: '',
  },
  runtimeConfig: {
    oauthClientSecret: '',
    typesenseApiKey: '',
    typesenseHost: '',
    typesensePort: '',
    typesenseProtocol: '',
    public: {
      apiUrl: '',
      oauthUrl: '',
      oauthClientId: '',
      oauthRedirectUri: '',
      clientVersion: pkg.version,
      oauthAccessTokenTest: '',
    },
  },
  plugins: ['~/plugins/api.ts'],
});