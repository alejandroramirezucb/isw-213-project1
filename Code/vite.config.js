import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'cliente/main.js'),
        admin: resolve(__dirname, 'cliente/admin.js'),
        carrito: resolve(__dirname, 'cliente/carrito.js'),
        historial: resolve(__dirname, 'cliente/historial.js'),
        perfil: resolve(__dirname, 'cliente/perfil.js'),
        chofer: resolve(__dirname, 'cliente/chofer.js'),
        ayuda: resolve(__dirname, 'cliente/ayuda.js'),
        auth: resolve(__dirname, 'cliente/auth.js'),
        'producto-detalle': resolve(__dirname, 'cliente/producto-detalle.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'dist-assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'cliente'),
    },
  },
});
