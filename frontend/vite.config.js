
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  base: '/South-Korea-Labor-Analytics/',

  server: {
    port: 5173,
    strictPort: false
  }
})
