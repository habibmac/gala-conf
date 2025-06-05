// @ts-check
import antfu from '@antfu/eslint-config';
import perfectionist from 'eslint-plugin-perfectionist';
import tailwind from 'eslint-plugin-tailwindcss';

import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  await antfu({
    // Enable formatting rules
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
    },

    // Customize stylistic rules
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },

    // Enable TypeScript support
    typescript: true,

    // Enable Vue support
    vue: true,
  }),

  // Tailwind CSS plugin configuration
  ...tailwind.configs['flat/recommended'],

  {
    plugins: {
      tailwindcss: tailwind,
    },
    rules: {
      'tailwindcss/classnames-order': 'error',
      'tailwindcss/no-custom-classname': 'off',
    },
  },

  // Perfectionist plugin for sorting
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-array-includes': ['error', { order: 'asc', type: 'natural' }],
      'perfectionist/sort-exports': ['error', { order: 'asc', type: 'natural' }],
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            'type',
            ['builtin', 'external'],
            'internal-type',
            'internal',
            ['parent-type', 'sibling-type', 'index-type'],
            ['parent', 'sibling', 'index'],
            'object',
            'unknown',
          ],
          order: 'asc',
          type: 'natural',
        },
      ],
      'perfectionist/sort-named-imports': ['error', { order: 'asc', type: 'natural' }],
      'perfectionist/sort-objects': ['error', { order: 'asc', type: 'natural' }],
    },
  },

  // Additional custom rules and overrides
  {
    rules: {
      // Disable some antfu rules that might conflict
      'antfu/no-cjs-exports': 'off',
      'antfu/no-import-dist': 'off',
      'antfu/top-level-function': 'off',
      'no-alert': 'off',
      // Custom rules for better code quality
      'no-console': 'warn',
      'no-debugger': 'error',

      'no-var': 'error',
      'prefer-const': 'error',
      'style/semi': ['error', 'always'],

      'tailwindcss/no-custom-classnames': 'off',

      'ts/no-use-before-define': 'off',
      'vue/custom-event-name-casing': ['error', 'kebab-case'],
      'vue/multi-word-component-names': 'off',

      'vue/no-multiple-template-root': 'off',
    },
  },
  {
    ignores: [
      // Ignore specific files and directories
      './components/ui/**',
    ],
  },
);
