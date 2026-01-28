import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost+3-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost+3.pem')),
    },
    proxy: {
      '/api': {
        target: 'http://10.0.0.10:6001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})