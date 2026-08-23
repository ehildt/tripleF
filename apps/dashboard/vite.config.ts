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
      '@': path.resolve(import.meta.dirname, './src'),
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
    rolldownOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        codeSplitting: {
          groups: [
            {
              name: 'vue-vendor',
              test: /node_modules[\\/](vue|vue-router|pinia|vue-i18n|@vueuse)/,
              priority: 30,
            },
            {
              name: 'markdown',
              // turndown is deliberately excluded: it is only used at submit
              // time (load-turndown.helper), so a dynamic import gives it its
              // own on-demand chunk instead of dragging it into the eagerly
              // loaded markdown bundle.
              test: /node_modules[\\/](markdown-it|dompurify)/,
              priority: 30,
            },
            {
              name: 'socket',
              test: /node_modules[\\/]socket\.io-client/,
              priority: 30,
            },
            {
              name: 'query',
              test: /node_modules[\\/]@tanstack/,
              priority: 30,
            },
            {
              name: 'motion',
              test: /node_modules[\\/]motion-v/,
              priority: 30,
            },
            {
              name: 'ui',
              test: /node_modules[\\/](@lucide|@headlessui)/,
              priority: 30,
            },
            {
              name: 'date',
              test: /node_modules[\\/]date-fns/,
              priority: 30,
            },
            {
              name: 'cuid',
              test: /node_modules[\\/]@paralleldrive/,
              priority: 30,
            },
          ],
        },
      },
    },
  },
});
