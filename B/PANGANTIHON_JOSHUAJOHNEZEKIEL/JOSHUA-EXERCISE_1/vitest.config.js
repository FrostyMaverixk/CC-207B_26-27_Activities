import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest runs browser-shape unit tests in jsdom. It does NOT need the
// react-compiler babel preset (that only matters for the production bundle),
// so we use a minimal plugin set for speed and isolation.
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Component files don't import React (the app relies on the automatic
    // JSX runtime) — mirror that for tests so JSX compiles the same way.
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    globals: false,
    css: false,
  },
})