import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    passWithNoTests: true,
    exclude: ['**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['servidor/**/*.js'],
      exclude: [
        'servidor/index.js',
        'servidor/db.js',
        'servidor/utils.js',
        'servidor/rutas/**',
        'servidor/repositorios/**',
        'servidor/servicios/**',
        'servidor/controladores/**',
        'node_modules/**',
      ],
    },
  },
});
