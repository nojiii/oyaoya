import { beforeEach, test, vi } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'

// debugTheme.ts は選んだ色をモジュールの中に覚えるので、テストごとに読み直す
beforeEach(() => {
  vi.resetModules()
})

// ブラウザの sessionStorage・location・<html> の style の代わり。startDebugTheme・setDebugTheme が使う
function fakeBrowser({ search = '', stored = {}, broken = false } = {}) {
  const storage = new Map(Object.entries(stored))
  const style = new Map()
  const fail = () => {
    throw new Error('storage is not available')
  }
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    sessionStorage: globalThis.sessionStorage,
  }
  globalThis.window = { location: { search } }
  globalThis.document = {
    documentElement: {
      style: {
        setProperty: (name, value) => style.set(name, value),
        removeProperty: (name) => style.delete(name),
      },
    },
  }
  globalThis.sessionStorage = broken
    ? { getItem: fail, setItem: fail, removeItem: fail }
    : {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      }
  return {
    storage,
    style,
    restore() {
      Object.assign(globalThis, previous)
    },
  }
}

test('the debug query decides the script color', async () => {
  const { resolveDebugTheme } = await import('../src/debugTheme.ts')
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
})

test('the chosen color is kept for the tab and removed when debugging ends', async () => {
  const browser = fakeBrowser({ search: '?debug=blue' })
  try {
    const { getDebugTheme, setDebugTheme, startDebugTheme } =
      await import('../src/debugTheme.ts')
    startDebugTheme()
    assert.equal(getDebugTheme(), 'blue')
    assert.equal(browser.storage.get('debug-theme'), 'blue')
    assert.equal(browser.style.get('--teach-bg'), '#1d4ed8')

    setDebugTheme('green')
    assert.equal(browser.storage.get('debug-theme'), 'green')
    assert.equal(browser.style.get('--teach-bg'), '#15803d')

    // 「デバッグを終える」：覚えた色を消し、橙（index.css のまま）に戻す
    setDebugTheme(null)
    assert.equal(getDebugTheme(), null)
    assert.equal(browser.storage.size, 0)
    assert.equal(browser.style.size, 0)
  } finally {
    browser.restore()
  }
})

test('starting reads ?debug=off and stale colors, and survives unavailable storage', async () => {
  const cases = [
    // ?debug=off で、覚えた色を消す
    { search: '?debug=off', stored: { 'debug-theme': 'red' }, theme: null },
    // 今の一覧にない色を覚えていたら消す
    { search: '', stored: { 'debug-theme': 'yellow' }, theme: null },
    // 覚えた色を続ける
    { search: '', stored: { 'debug-theme': 'red' }, theme: 'red' },
    // 何も指定がなければ何もしない
    { search: '', stored: {}, theme: null },
  ]
  for (const { search, stored, theme } of cases) {
    const browser = fakeBrowser({ search, stored })
    // ページを開き直すたびに、覚えた色のない状態から始める
    vi.resetModules()
    try {
      const { getDebugTheme, startDebugTheme } =
        await import('../src/debugTheme.ts')
      startDebugTheme()
      assert.equal(getDebugTheme(), theme, search + JSON.stringify(stored))
      assert.equal(
        browser.storage.get('debug-theme') ?? null,
        theme,
        search + JSON.stringify(stored),
      )
    } finally {
      browser.restore()
    }
  }

  // 保存を使えないブラウザでも落ちず、URL の指定で色を替える
  const browser = fakeBrowser({ search: '?debug=teal', broken: true })
  try {
    const { getDebugTheme, setDebugTheme, startDebugTheme } =
      await import('../src/debugTheme.ts')
    startDebugTheme()
    assert.equal(getDebugTheme(), 'teal')
    assert.equal(browser.style.get('--teach-bg'), '#0f766e')
    setDebugTheme(null)
    assert.equal(browser.style.size, 0)
  } finally {
    browser.restore()
  }
})

test('debug themes replace the script color and keep white text readable', async () => {
  const { DEBUG_THEMES, applyDebugTheme } = await import('../src/debugTheme.ts')
  const ids = DEBUG_THEMES.map((theme) => theme.id)
  assert.equal(ids[0], 'orange')
  assert.equal(new Set(ids).size, ids.length)
  const others = DEBUG_THEMES.filter((theme) => theme.color !== '#c2410c')
  assert.ok(others.length >= 7, 'at least 7 colors besides orange')

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
  const tints = [
    '--teach-muted',
    '--color-accent-soft',
    '--color-accent-mark',
    '--color-accent-bright',
  ]
  applyDebugTheme('blue', fakeStyle)
  assert.equal(style.get('--teach-bg'), '#1d4ed8')
  assert.equal(style.get('--color-accent'), '#1d4ed8')
  // 淡い色も、いつもの橙のまま残らないように替える
  for (const name of tints) {
    assert.match(style.get(name), /^color-mix\(in oklch, #1d4ed8 /, name)
  }
  // 橙に戻すと、index.css の色をそのまま使う
  applyDebugTheme('orange', fakeStyle)
  assert.equal(style.size, 0)
  // 淡い色をほかと同じ作り方にした橙は、淡い色だけ作り直す
  applyDebugTheme('orange-mix', fakeStyle)
  assert.equal(style.get('--teach-bg'), '#c2410c')
  for (const name of tints) {
    assert.match(style.get(name), /^color-mix\(in oklch, #c2410c /, name)
  }
  applyDebugTheme(null, fakeStyle)
  assert.equal(style.size, 0)
})

test('the color switcher appears only in debug mode', async () => {
  const browser = fakeBrowser()
  try {
    const { setDebugTheme } = await import('../src/debugTheme.ts')
    const { Layout } = await import('../src/pages/Layout.tsx')
    const render = (path) => {
      const router = createMemoryRouter(
        [
          {
            element: createElement(Layout),
            children: [{ path: '*', element: createElement('p') }],
          },
        ],
        { initialEntries: [path] },
      )
      return renderToString(createElement(RouterProvider, { router }))
    }
    // ふつうの画面にも、大学祭モードの画面にも出さない
    for (const path of ['/', '/festival']) {
      assert.ok(!render(path).includes('台本の色を変える'), path)
    }
    setDebugTheme('purple')
    assert.ok(render('/').includes('台本の色を変える'))
    setDebugTheme(null)
    assert.ok(!render('/').includes('台本の色を変える'))
  } finally {
    browser.restore()
  }
})
