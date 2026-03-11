import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: true,
  gitignore: true,
  jsonc: true,
  ignores: [
    'node_modules',
    'utils/env.js',
  ],
  rules: {
    'pnpm/json-enforce-catalog': 0,
    'antfu/if-newline': 0,
    'style/brace-style': 0,
    'no-console': 0,
  },
  globals: {
    GM_addElement: true,
  },
})
