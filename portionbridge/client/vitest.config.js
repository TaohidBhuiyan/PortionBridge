import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Test-only config (kept separate so vite.config.js — the dev/build config — is untouched).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
  },
});
