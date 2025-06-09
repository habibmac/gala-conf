import pkg from './package.json';

export default defineNuxtConfig({
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
  colorMode: {
    classSuffix: '',
  },
  compatibilityDate: '2024-04-03',
  css: ['~/assets/scss/main.scss'],
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  eslint: {
    config: {
      standalone: false,
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
    'nuxt-qrcode',
  ],
  plugins: ['~/plugins/api.ts'],
  runtimeConfig: {
    oauthClientSecret: '',
    public: {
      apiUrl: '',
      clientVersion: pkg.version,
      oauthAccessTokenTest: '',
      oauthClientId: '',
      oauthRedirectUri: '',
      oauthUrl: '',
    },
    typesenseApiKey: '',
    typesenseHost: '',
    typesensePort: '',
    typesenseProtocol: '',
  },
});
