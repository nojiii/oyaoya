import { createServer } from 'vite'

// テストで src のモジュールを読むための Vite サーバー。
// 開発中の `npm run dev` とぶつからないよう、ポートを開かず（hmr・ws なし）、依存の事前変換も別の場所に置く
export function createTestServer() {
  return createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    cacheDir: 'node_modules/.vite-test',
    logLevel: 'warn',
  })
}
