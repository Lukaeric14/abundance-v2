const { configs } = require('@typescript-eslint/eslint-plugin');

module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'prefer-const': 'warn',
  },
};