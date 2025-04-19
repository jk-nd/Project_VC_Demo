import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/backend': {
        target: 'http://localhost:12000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, '')
      },
      '/auth': {
        target: 'http://localhost:80',
        changeOrigin: true,
      }
    }
  }
})
