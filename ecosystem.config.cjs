module.exports = {
  apps: [
    {
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      exec_mode: 'cluster',
      instances: 'max',
      name: 'live.galanesia.com',
      script: './server/index.mjs',
    },
  ],
};
