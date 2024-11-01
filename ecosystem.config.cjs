module.exports = {
  apps: [
    {
      name: 'live.galanesia.com',
      exec_mode: 'cluster',
      instances: 'max',
      script: './server/index.mjs',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
