// デバッグ用：台本のテーマカラー（いつもは橙）を別の色に替えて、見やすさを見比べる。
// URL に ?debug を付けて開くと、画面の左下に色を選ぶボタンが出る。?debug=blue のように色を指定して開くこともでき、?debug=off で終える。
// 選んだ色はこの端末に覚えておくので、ページを移っても、開き直しても続く
export interface DebugTheme {
  id: string
  name: string
  color: string
}

// どれも白い文字を 4.5:1 以上で読める濃さにする（橙 5.18:1 と同じかそれより濃い）
export const DEBUG_THEMES: DebugTheme[] = [
  // いつもの色。index.css の --teach-bg と同じ
  { id: 'orange', name: '橙（いまの色）', color: '#c2410c' },
  { id: 'blue', name: '青', color: '#1d4ed8' },
  { id: 'sky', name: '水色', color: '#0369a1' },
  { id: 'teal', name: '青緑', color: '#0f766e' },
  { id: 'green', name: '緑', color: '#15803d' },
  { id: 'purple', name: '紫', color: '#7e22ce' },
  { id: 'red', name: '赤', color: '#be123c' },
  { id: 'slate', name: '墨', color: '#334155' },
]

const DEFAULT_THEME = 'orange'
const STORAGE_KEY = 'debug-theme'

function knownTheme(id: string | null) {
  return DEBUG_THEMES.some((theme) => theme.id === id) ? id : null
}

// URL の ?debug と、前に選んで覚えておいた色から、使う色を決める。null はデバッグモードでないとき
export function resolveDebugTheme(
  search: string,
  stored: string | null,
): string | null {
  const param = new URLSearchParams(search).get('debug')
  if (param === 'off') return null
  if (param === null) return knownTheme(stored)
  // ?debug だけ、または知らない色のときは、覚えておいた色（なければ橙）で始める
  return knownTheme(param) ?? knownTheme(stored) ?? DEFAULT_THEME
}

// 台本の画面の色（--teach-bg）と、同じ色を使うところ（--color-accent など）をまとめて替える。
// 淡い色は、選んだ色を白に混ぜて作る（数字は白に混ぜる割合。index.css の橙の淡い色に近づけてある）
const TINTS = {
  '--teach-muted': 7,
  '--color-accent-soft': 12,
  '--color-accent-mark': 28,
  '--color-accent-bright': 45,
}

export function applyDebugTheme(
  id: string | null,
  style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>,
) {
  const color = DEBUG_THEMES.find((theme) => theme.id === id)?.color
  const names = ['--teach-bg', '--color-accent', ...Object.keys(TINTS)]
  if (!color || id === DEFAULT_THEME) {
    for (const name of names) style.removeProperty(name)
    return
  }
  style.setProperty('--teach-bg', color)
  style.setProperty('--color-accent', color)
  for (const [name, percent] of Object.entries(TINTS)) {
    style.setProperty(name, `color-mix(in srgb, ${color} ${percent}%, #fff)`)
  }
}

let current: string | null = null

export function getDebugTheme() {
  return current
}

// 色を替えて覚えておく。null でデバッグモードを終え、いつもの橙に戻す
export function setDebugTheme(id: string | null) {
  current = id
  applyDebugTheme(id, document.documentElement.style)
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 保存できないブラウザでは、この画面の間だけ色を替える
  }
}

// 最初の描画の前に呼び、色が一瞬だけ橙で出るのを防ぐ
export function startDebugTheme() {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    // 保存を読めないブラウザでは、URL の指定だけで決める
  }
  const id = resolveDebugTheme(window.location.search, stored)
  if (id || stored) setDebugTheme(id)
}
