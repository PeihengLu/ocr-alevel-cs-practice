import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const root = resolve(__dirname)
const pyodideFiles = [
  'pyodide.mjs',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
  'package.json'
]

function copyPyodide(): Plugin {
  const copy = (outDir: string) => {
    const from = resolve(root, 'node_modules/pyodide')
    const to = resolve(outDir, 'pyodide')
    mkdirSync(to, { recursive: true })
    for (const name of pyodideFiles) {
      const src = resolve(from, name)
      if (!existsSync(src)) {
        throw new Error(`Missing Pyodide file: ${src}`)
      }
      cpSync(src, resolve(to, name))
    }
  }

  return {
    name: 'copy-pyodide',
    buildStart() {
      copy(resolve(root, 'src/renderer/public'))
    },
    closeBundle() {
      copy(resolve(root, 'dist-tauri'))
    }
  }
}

export default defineConfig({
  root: resolve(root, 'src/renderer'),
  publicDir: resolve(root, 'src/renderer/public'),
  clearScreen: false,
  plugins: [react(), copyPyodide()],
  resolve: {
    alias: {
      '@': resolve(root, 'src/renderer/src')
    }
  },
  server: {
    port: 1420,
    strictPort: true
  },
  build: {
    outDir: resolve(root, 'dist-tauri'),
    emptyOutDir: true,
    target: 'esnext'
  },
  envPrefix: ['VITE_', 'TAURI_'],
  optimizeDeps: {
    exclude: ['pyodide']
  }
})
