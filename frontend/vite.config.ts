import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import * as process from 'process'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/npl': {
        target: 'http://localhost:12000',
        changeOrigin: true,
        rewrite: (path) => {
          console.log(`Before rewrite: ${path}`);
          const result = path;
          console.log(`After rewrite: ${result}`);
          return result;
        }
      },
      '/api': {
        target: 'http://localhost:12000',
        changeOrigin: true,
        rewrite: (path) => {
          console.log(`Before rewrite: ${path}`);
          const result = path;
          console.log(`After rewrite: ${result}`);
          return result;
        }
      },
      '/backend': {
        target: 'http://localhost:12000',
        changeOrigin: true,
        rewrite: (path) => {
          console.log(`Before rewrite: ${path}`);
          const result = path.replace(/^\/backend/, '');
          console.log(`After rewrite: ${result}`);
          return result;
        }
      },
      '/auth': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
