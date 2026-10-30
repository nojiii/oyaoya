import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTestServer } from './viteServer.mjs'

test('the debug query decides the script color, and the choice is remembered', async () => {
  const server = await createTestServer()
  try {
    const { resolveDebugTheme } =
      await server.ssrLoadModule('/src/debugTheme.ts')
    // ?debug がなく、覚えた色もなければ、デバッグモードにしない
    assert.equal(resolveDebugTheme('', null), null)
    assert.equal(resolveDebugTheme('?n=3', null), null)
    // ?debug だけなら、覚えた色か橙で始める
    assert.equal(resolveDebugTheme('?debug', null), 'orange')
    assert.equal(resolveDebugTheme('?debug=1', null), 'orange')
    assert.equal(resolveDebugTheme('?debug', 'green'), 'green')
    // 色を指定したときは、覚えた色より優先する
    assert.equal(resolveDebugTheme('?debug=blue', 'green'), 'blue')
    // ?debug を付けずに開き直しても、覚えた色を続ける
    assert.equal(resolveDebugTheme('', 'purple'), 'purple')
    // 覚えた色が今の一覧にないときは使わない
    assert.equal(resolveDebugTheme('', 'yellow'), null)
    assert.equal(resolveDebugTheme('?debug', 'yellow'), 'orange')
    // ?debug=off で終える
    assert.equal(resolveDebugTheme('?debug=off', 'green'), null)
  } finally {
    await server.close()
  }
})

test('debug themes replace the script color and keep white text readable', async () => {
  const server = await createTestServer()
  try {
    const { DEBUG_THEMES, applyDebugTheme } =
      await server.ssrLoadModule('/src/debugTheme.ts')
    const ids = DEBUG_THEMES.map((theme) => theme.id)
    assert.equal(ids[0], 'orange')
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(ids.length >= 8, 'orange and at least 7 other colors')

    // 白い文字が 4.5:1 以上で読める濃さか
    const luminance = (hex) => {
      const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    for (const theme of DEBUG_THEMES) {
      const contrast = 1.05 / (luminance(theme.color) + 0.05)
      assert.ok(contrast >= 4.5, `${theme.id}: ${contrast.toFixed(2)}`)
    }

    const style = new Map()
    const fakeStyle = {
      setProperty: (name, value) => style.set(name, value),
      removeProperty: (name) => style.delete(name),
    }
    applyDebugTheme('blue', fakeStyle)
    assert.equal(style.get('--teach-bg'), '#1d4ed8')
    assert.equal(style.get('--color-accent'), '#1d4ed8')
    // 淡い色も、いつもの橙のまま残らないように替える
    for (const name of [
      '--teach-muted',
      '--color-accent-soft',
      '--color-accent-mark',
      '--color-accent-bright',
    ]) {
      assert.match(style.get(name), /^color-mix\(in srgb, #1d4ed8 /, name)
    }
    // 橙に戻すと、index.css の色をそのまま使う
    applyDebugTheme('orange', fakeStyle)
    assert.equal(style.size, 0)
    applyDebugTheme('green', fakeStyle)
    applyDebugTheme(null, fakeStyle)
    assert.equal(style.size, 0)
  } finally {
    await server.close()
  }
})
