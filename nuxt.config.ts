import pkg from './package.json';

export default defineNuxtConfig({
  build: {
    transpile: ['@vuepic/vue-datepicker', 'vue-sonner', 'form-data'],
  },
  colorMode: {
    classSuffix: '',
  },
  compatibilityDate: '2024-04-03',
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  css: [
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
    families: [
      // Use local provider for full-featured Geist
      {
        name: 'Geist Variable',
        provider: 'local',
        src: [
          {
            path: '/fonts/Geist-Variable.woff2',
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    ],
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
      name: 'Conference Management Dashboard',
      short_name: 'ConfMgmt',
      description: 'Conference paper management and organizer dashboard',
      theme_color: '#3B82F6',
      background_color: '#F1F5F9',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      lang: 'en',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
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
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-stylesheets',
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
    oauthClientSecret: import.meta.env.NUXT_OAUTH_CLIENT_SECRET || '',
    public: {
      apiUrl: import.meta.env.NUXT_PUBLIC_API_URL || '',
      oauthUrl: import.meta.env.NUXT_PUBLIC_OAUTH_URL || '',
      oauthRedirectUri: import.meta.env.NUXT_PUBLIC_OAUTH_REDIRECT_URI || '',
      oauthClientId: import.meta.env.NUXT_PUBLIC_OAUTH_CLIENT_ID || '',
      oauthAccessTokenTest: import.meta.env.NUXT_PUBLIC_OAUTH_ACCESS_TOKEN_TEST || '',
      clientVersion: pkg.version,
      backendUrl: import.meta.env.NUXT_PUBLIC_BACKEND_URL || '',
    },
    typesenseApiKey: '',
    typesenseHost: '',
    typesensePort: '',
    typesenseProtocol: '',
  },
});
