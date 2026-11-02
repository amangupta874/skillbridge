import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: false } }, // browser sees ONE origin, so cookies just work
  },
  test: { environment: 'jsdom', setupFiles: './src/test/setup.js', globals: true, css: false },
});
