module.exports = {
  apps: [
    {
      name: "live.galanesia.com",
      exec_mode: "cluster",
      instances: "max",
      script: "./node_modules/nuxt/bin/nuxt.js",
      args: "start",
      env: {
        NODE_ENV: "production",
        GALA_OAUTH_CLIENT_SECRET: process.env.GALA_OAUTH_CLIENT_SECRET,
        NUXT_PUBLIC_GALA_API_URL: process.env.NUXT_PUBLIC_GALA_API_URL,
        NUXT_PUBLIC_GALA_OAUTH_URL: process.env.NUXT_PUBLIC_GALA_OAUTH_URL,
        NUXT_PUBLIC_GALA_OAUTH_CLIENT_ID:
          process.env.NUXT_PUBLIC_GALA_OAUTH_CLIENT_ID,
        NUXT_PUBLIC_GALA_OAUTH_REDIRECT_URI:
          process.env.NUXT_PUBLIC_GALA_OAUTH_REDIRECT_URI,
      },
    },
  ],
};
