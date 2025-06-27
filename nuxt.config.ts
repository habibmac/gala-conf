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
    '@vite-pwa/nuxt',
  ],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Gala Dashboard',
      short_name: 'GalaDash',
      description: 'Real-time event registration and management dashboard',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false, // Disable in development to avoid hydration issues
      type: 'module',
    },
  },
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
      backendUrl: '',
    },
    typesenseApiKey: '',
    typesenseHost: '',
    typesensePort: '',
    typesenseProtocol: '',
  },
});
