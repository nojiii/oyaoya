// デバッグ用：台本のテーマカラー（いつもは橙）を別の色に替えて、見やすさを見比べる。
// URL に ?debug を付けて開くと、画面の左端の中ほどに色を選ぶつまみが出る。?debug=blue のように色を指定して開くこともでき、?debug=off で終える。
// 選んだ色はこのタブの間だけ覚えておく（ページを移っても、開き直しても続く）。
// 大学祭の端末などで終え忘れても、タブを閉じれば元に戻るよう、端末には残さない
export interface DebugTheme {
  id: string
  name: string
  color: string
}

// どれも白い文字を 4.5:1 以上で読める濃さにする（5.0〜10.4:1。いまの橙は 5.18:1）
export const DEBUG_THEMES: DebugTheme[] = [
  // いつもの色。淡い色も含めて index.css のまま
  { id: 'orange', name: '橙（いまの色）', color: '#c2410c' },
  // index.css の橙の淡い色は、白に混ぜて作った色より鮮やか。ほかの色と同じ条件で比べるため、淡い色をほかと同じ作り方にした橙も置く
  {
    id: 'orange-mix',
    name: '橙（淡い色はほかと同じ作り方）',
    color: '#c2410c',
  },
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
// 淡い色は、選んだ色を白に混ぜて作る（数字は選んだ色の割合）。
// 色みが抜けにくい oklch で混ぜ、橙で作ったときに index.css の淡い色にいちばん近くなる割合にしてある
const TINTS = {
  '--teach-muted': 7,
  '--color-accent-soft': 12,
  '--color-accent-mark': 26,
  '--color-accent-bright': 41,
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
    style.setProperty(name, `color-mix(in oklch, ${color} ${percent}%, #fff)`)
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
    if (id) sessionStorage.setItem(STORAGE_KEY, id)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // 保存できないブラウザでは、この画面の間だけ色を替える
  }
}

// 最初の描画の前に呼び、色が一瞬だけ橙で出るのを防ぐ
export function startDebugTheme() {
  let stored: string | null = null
  try {
    stored = sessionStorage.getItem(STORAGE_KEY)
  } catch {
    // 保存を読めないブラウザでは、URL の指定だけで決める
  }
  const id = resolveDebugTheme(window.location.search, stored)
  if (id || stored) setDebugTheme(id)
}
