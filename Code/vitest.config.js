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
      include: [
        'cliente/utilidades/CalculadorPrecio.js',
        'cliente/servicios/CarritoServicio.js',
      ],
    },
  },
});
