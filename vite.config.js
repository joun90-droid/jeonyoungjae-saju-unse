import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://asia-northeast3-vaulted-acolyte-387217.cloudfunctions.net/sajuApi',
        changeOrigin: true,
      },
    },
  },
})
