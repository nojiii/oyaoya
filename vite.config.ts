import react from '@vitejs/plugin-react'
import { defineConfig, normalizePath, type Plugin } from 'vite'
import { CONTENT_DIR, loadContent } from './scripts/content.ts'

// content/ の YAML + Markdown を検証して `virtual:content` として読み込めるようにする。
// 不備があればビルドが失敗する。開発中は content/ の変更で画面を再読み込みする。
function content(): Plugin {
  const id = 'virtual:content'
  const resolvedId = `\0${id}`
  const contentDir = `${normalizePath(CONTENT_DIR)}/`

  return {
    name: 'oyaoya-content',
    resolveId(source) {
      if (source === id) return resolvedId
    },
    load(loadedId) {
      if (loadedId === resolvedId) {
        return `export default ${JSON.stringify(loadContent())}`
      }
    },
    configureServer(server) {
      server.watcher.add(CONTENT_DIR)
      server.watcher.on('all', (_, file) => {
        if (!normalizePath(file).startsWith(contentDir)) return
        const mod = server.moduleGraph.getModuleById(resolvedId)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), content()],
})
