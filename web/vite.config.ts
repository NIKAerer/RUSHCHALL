import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En dev, /api est relayé vers l'API Symfony : pas de CORS à gérer.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.API_URL ?? 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
