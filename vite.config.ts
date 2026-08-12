import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages などサブパス配信でも動くよう相対パスでビルドする
export default defineConfig({
  plugins: [react()],
  base: './'
})
