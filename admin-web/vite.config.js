import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 127.0.0.1 is more reliable on Windows than host: true (0.0.0.0)
    host: '127.0.0.1',
    strictPort: true,
    open: '/login',
  },
  preview: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true,
  },
});
