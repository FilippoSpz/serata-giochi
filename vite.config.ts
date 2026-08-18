import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  build: {
    // I media vivono in public/: Vite li copia senza passarli per il bundler,
    // quindi il chunk JS resta piccolo anche con 269 MB di cartella.
    assetsInlineLimit: 0,
  },
})
