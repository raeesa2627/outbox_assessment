import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': {
        target: 'https://outbox-assessment-g02v.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://outbox-assessment-g02v.onrender.com',
        changeOrigin: true,
      },
    },
  },
});

