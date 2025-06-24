import pkg from './package.json';

export default defineNuxtConfig({
  build: {
    transpile: ['@vuepic/vue-datepicker', 'vue-sonner'],
  },
  colorMode: {
    classSuffix: '',
  },
  compatibilityDate: '2024-04-03',
  css: [
    '@fontsource-variable/geist/index.css',
    '@fontsource-variable/geist/wght.css',
    '~/assets/scss/main.scss',
  ],
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
  fonts: {
    fontsource: {
      geist: {
        styles: ['normal'],
        display: 'swap',
        pkg: '@fontsource/geist',
        subsets: ['latin'],
      },
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
    'vue-sonner/nuxt',
  ],
  plugins: [
    '~/plugins/vue-query.ts',
    '~/plugins/api.ts',
    '~/plugins/auth.ts',
  ],
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
