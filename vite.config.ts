import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ command }) => {
  // Only load HTTPS certs for dev server, not build
  const httpsConfig = command === 'serve' && fs.existsSync(path.resolve(__dirname, 'localhost+3-key.pem'))
      ? {
        key: fs.readFileSync(path.resolve(__dirname, 'localhost+3-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, 'localhost+3.pem')),
      }
      : undefined;

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      https: httpsConfig,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        }
      }
    }
  }
})