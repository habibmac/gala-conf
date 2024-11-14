// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt([
  {
    rules: {
      // Allow multiple template root elements
      'vue/no-multiple-template-root': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': 'off',
    },
    ignores: ['components/**/*.vue|js|ts'],
  },
  // other config
]);
