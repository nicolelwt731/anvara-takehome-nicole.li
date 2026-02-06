import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    // Set passWithNoTests to true to allow runs with no tests
    passWithNoTests: true,
  },
});
