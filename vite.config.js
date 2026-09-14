import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        // Multi-page build: each entry becomes a real URL, so the press release
        // is shareable and indexable without any SPA routing or host rewrites.
        main: here('index.html'),
        press: here('wice-press-release/index.html'),
      },
    },
  },
})
