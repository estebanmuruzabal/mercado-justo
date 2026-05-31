import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    globals: true,
    passWithNoTests: true,
  },
  resolve: {
    alias: [
      { find: '@/domains', replacement: path.resolve(__dirname, './src/domains') },
      { find: '@/shared', replacement: path.resolve(__dirname, './src/shared') },
      { find: '@', replacement: path.resolve(__dirname, './') },
    ],
  },
})