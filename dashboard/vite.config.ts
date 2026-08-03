// https://vite.dev/config/
import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

import { readAppVersion } from './app-version.js';

const env = loadEnv('all', process.cwd(), 'VITE_');
const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(readAppVersion()),
  },
  base: '/dashboard/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // The playwright-mcp sidecar reaches the dashboard by container name
    // (http://dashboard:5173), so allow that host alongside the defaults.
    allowedHosts: ['dashboard'],
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
