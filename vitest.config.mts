import { defineConfig } from 'vitest/config';

// No jsdom/React Testing Library -- everything under test (lib/calculator.ts,
// lib/unsubscribe-token.ts) is plain Node logic, not React components.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
  },
});
