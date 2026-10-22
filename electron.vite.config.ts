import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const edition = process.env.VITE_EDITION || process.env.EDITION || 'student'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    define: {
      // Edition fixed at build/dev time via VITE_EDITION / EDITION.
      'import.meta.env.VITE_EDITION': JSON.stringify(edition)
    }
  }
})
