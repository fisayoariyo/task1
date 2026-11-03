import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/restaurants': 'http://127.0.0.1:3001',
      '/places': 'http://127.0.0.1:3001',
      '/auth': 'http://127.0.0.1:3001',
      '/orders': 'http://127.0.0.1:3001',
      // API only — do not proxy SPA routes like /admin or /admin/login
      '/admin/auth': 'http://127.0.0.1:3001',
      '/admin/customers': 'http://127.0.0.1:3001',
      '/admin/orders': 'http://127.0.0.1:3001',
      // Same shape as production nginx: /api/* → Nest /*
      '/api': {
        target: 'http://127.0.0.1:3001',
        rewrite: (path) => path.replace(/^\/api/, '') || '/',
      },
    },
  },
})
