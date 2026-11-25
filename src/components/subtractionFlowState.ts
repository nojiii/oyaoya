import type { FlowStatus } from './TeachingScript'

export type SubtractionRoute = 'physical' | 'app'
export type SubtractionPage =
  | 'read'
  | 'choose'
  | 'prepare'
  | 'remove'
  | 'count'
  | 'app'
  | 'answer'
  | 'more'
  | 'explain'
  | 'check'
  | 'checkAnswer'
export interface SubtractionProgress {
  route: SubtractionRoute | null
  page: SubtractionPage
  appComplete: boolean
  // 準備の画面の「わかる」で、解説をとばして、たしかめの問題（ひとりで解く）から始めたか
  checkOnly: boolean
}
export type SubtractionAction =
  // review は、たしかめの問題が解けなかったときに、解説（問題を読むページ）へ戻る
  | { type: 'next' | 'back' | 'review' }
  | { type: 'choose'; route: SubtractionRoute }
  | { type: 'app-status'; complete: boolean }

export const initialSubtractionProgress: SubtractionProgress = {
  route: null,
  page: 'read',
  appComplete: false,
  checkOnly: false,
}
// 準備の画面の「わかる」で始めるときの進み具合。方法は選ばずに、ひとりで解くページから
export const checkOnlySubtractionProgress: SubtractionProgress = {
  route: null,
  page: 'check',
  appComplete: false,
  checkOnly: true,
}
// checkOnly は、準備の画面の「わかる」で始めたとき。解説をとばして、ひとりで解く → 答えを確かめる、だけにする
export function subtractionPages(
  route: SubtractionRoute | null,
  checkOnly = false,
): SubtractionPage[] {
  if (checkOnly) return ['check', 'checkAnswer']
  const end: SubtractionPage[] = [
    'answer',
    'more',
    'explain',
    'check',
    'checkAnswer',
  ]
  if (route === 'physical')
    return ['read', 'choose', 'prepare', 'remove', 'count', ...end]
  if (route === 'app') return ['read', 'choose', 'app', ...end]
  return ['read', 'choose']
}
export function canAdvanceSubtraction(state: SubtractionProgress) {
  if (state.page === 'choose') return state.route !== null
  return (
    state.page !== 'checkAnswer' && (state.page !== 'app' || state.appComplete)
  )
}
export function advanceSubtraction(
  state: SubtractionProgress,
  action: SubtractionAction,
): SubtractionProgress {
  if (action.type === 'choose')
    return state.page === 'choose'
      ? {
          route: action.route,
          page: 'choose',
          appComplete: false,
          checkOnly: false,
        }
      : state
  if (action.type === 'app-status')
    return state.page === 'app' && state.appComplete !== action.complete
      ? { ...state, appComplete: action.complete }
      : state
  // たしかめのページからだけ戻る。選んだ方法は残すので、方法を選ぶページは選んだ状態で出る
  // （「わかる」で始めたときは、まだ選んでいないので、選ぶところから）
  if (action.type === 'review')
    return state.page === 'check' || state.page === 'checkAnswer'
      ? {
          route: state.route,
          page: 'read',
          appComplete: false,
          checkOnly: false,
        }
      : state
  if (action.type === 'next' && !canAdvanceSubtraction(state)) return state
  const pages = subtractionPages(state.route, state.checkOnly)
  const page =
    pages[pages.indexOf(state.page) + (action.type === 'next' ? 1 : -1)]
  return page ? { ...state, page } : state
}
export function subtractionStorageKey(pathname: string, a: number, b: number) {
  return `subtraction-flow:v1:${pathname}:${a}-${b}`
}
function parse(raw: string | null) {
  try {
    const saved = JSON.parse(
      raw ?? 'null',
    ) as Partial<SubtractionProgress> | null
    const checkOnly = saved?.checkOnly === true
    if (
      saved &&
      (saved.route === null ||
        saved.route === 'physical' ||
        saved.route === 'app') &&
      saved.page &&
      subtractionPages(saved.route, checkOnly).includes(saved.page)
    )
      return {
        route: saved.route,
        page: saved.page,
        appComplete: false,
        checkOnly,
      }
  } catch {
    /* 保存内容が壊れていたら最初から始める。 */
  }
  return null
}
export function restoreSubtractionProgress(
  raw: string | null,
): SubtractionProgress {
  const saved = parse(raw)
  return saved && saved.page !== 'checkAnswer'
    ? saved
    : { ...initialSubtractionProgress }
}
export function subtractionFlowStatus(raw: string | null): FlowStatus {
  const saved = parse(raw)
  return !saved || saved.page === 'read'
    ? 'start'
    : saved.page === 'checkAnswer'
      ? 'finished'
      : 'middle'
}
// 引く数を変え、0〜10の範囲で必ず元とは違う問題を出す。
export function subtractionCheck(a: number, b: number): [number, number] {
  if (a === 0) return [1, 0]
  return [a, b < a ? b + 1 : b - 1]
}
