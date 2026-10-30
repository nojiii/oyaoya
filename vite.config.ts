import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // npm test（Vitest）の設定。テストはふだん Node.js の上で動かし、
  // 画面を操作して確かめるテストだけ、ファイルの先頭で happy-dom（ブラウザの代わり）を指定する
  test: {
    include: ['tests/**/*.test.mjs'],
  },
})
