import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    passWithNoTests: true,
    exclude: ['**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['cliente/**/*.js'],
      exclude: [
        'cliente/admin.js',
        'cliente/auth.js',
        'cliente/ayuda.js',
        'cliente/carrito.js',
        'cliente/chofer.js',
        'cliente/historial.js',
        'cliente/main.js',
      ],
    },
  },
});
