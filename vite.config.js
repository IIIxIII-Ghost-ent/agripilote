import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'AgriPilote',
        short_name: 'AgriPilote',
        description: 'Gestion agricole intelligente',
        theme_color: '#1A2E26',
        background_color: '#FDFCF9',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/app',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})