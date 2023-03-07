import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        background: fileURLToPath(new URL('./src/background.ts', import.meta.url)),
        index: fileURLToPath(new URL('./src/index.scss', import.meta.url)),
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      },
    },
  },
})
