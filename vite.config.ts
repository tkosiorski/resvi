import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  build: {
    target: 'ES2020',
    rollupOptions: {
      input: {
        popup: 'src/pages/popup/index.html'
      }
    }
  },
  server: {
    port: 3000,
    hmr: {
      port: 3001
    }
  }
})