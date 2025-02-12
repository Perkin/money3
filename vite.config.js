import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'docs', // Билд будет сразу в папку docs/ для GitHub Pages
  },
})
