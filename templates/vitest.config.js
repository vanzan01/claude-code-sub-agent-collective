const { defineConfig } = require('vitest/config')

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['.claude-collective/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Configure vitest to find dependencies in the .claude-collective subdirectory
    deps: {
      external: ['fs-extra']
    }
  }
})