import type { FlowStatus } from './TeachingScript'

export type AdditionRoute = 'physical' | 'app'
export type AdditionPage =
  | 'read'
  | 'choose'
  | 'prepare'
  | 'combine'
  | 'count'
  // 繰り上がり（10をつくって、たし算する）の実物のおはじき。combine・count の代わりに、10のまとまりを作ってから合わせる
  | 'makeTen'
  | 'countTen'
  | 'app'
  | 'answer'
  | 'explain'
  | 'check'

export interface AdditionProgress {
  route: AdditionRoute | null
  page: AdditionPage
  appComplete: boolean
  answerVisible: boolean
}

export const initialAdditionProgress: AdditionProgress = {
  route: null,
  page: 'read',
  appComplete: false,
  answerVisible: false,
}

// 答えのあとの「たしかめ」。どう考えたかを話してもらい、ちがう数の問題をひとりで解いてもらう
const checkPages: AdditionPage[] = ['explain', 'check']

// carry は、繰り上がりのたし算（10をつくって、たし算する）の台本。実物のおはじきで、10のまとまりを作ってから合わせる
export function additionPages(
  route: AdditionRoute | null,
  carry = false,
): AdditionPage[] {
  if (route === 'physical')
    return [
      'read',
      'choose',
      'prepare',
      ...(carry
        ? (['makeTen', 'countTen'] as const)
        : (['combine', 'count'] as const)),
      'answer',
      ...checkPages,
    ]
  if (route === 'app') return ['read', 'choose', 'app', 'answer', ...checkPages]
  return ['read', 'choose']
}

// たしかめで、お子さんがひとりで解く問題。元の問題をまねるだけでは解けないよう、
// 2つの数を入れかえて、2つ目を1つ増やす（合計が10のときは、1つ減らす）
export function additionCheck(a: number, b: number): [number, number] {
  if (a + b < 10) return [b, a + 1]
  return a > 0 ? [b, a - 1] : [b - 1, a]
}

// 繰り上がりのたし算の、たしかめの問題（8 ＋ 5 なら 7 ＋ 5）。同じように10を作って、残りが出る問題にする。
// 最初の数を1つ減らす。減らすと合計が10になるときは、2つ目を1つ増やす（2つ目が9なら、最初の数を1つ増やす）
export function carryCheck(a: number, b: number): [number, number] {
  if (a + b >= 12) return [a - 1, b]
  return b < 9 ? [a, b + 1] : [a + 1, b]
}

export type AdditionAction =
  | { type: 'next' | 'back' | 'reveal' | 'restart' }
  | { type: 'choose'; route: AdditionRoute }
  | { type: 'app-status'; complete: boolean }

// 方法を選ぶページは、選ぶまで進めない（選んだら、スワイプで進む）。答えのページは、答えを見てから進む。
// たしかめの、ひとりで解くページが最後
export function canAdvanceAddition(state: AdditionProgress) {
  if (state.page === 'choose') return state.route !== null
  if (state.page === 'answer') return state.answerVisible
  return state.page !== 'check' && (state.page !== 'app' || state.appComplete)
}

export function advanceAddition(
  state: AdditionProgress,
  action: AdditionAction,
  carry = false,
): AdditionProgress {
  switch (action.type) {
    case 'restart':
      return { ...initialAdditionProgress }
    // 方法を選ぶだけで、ページは進めない。進むのは、選んだあとのスワイプ（next）
    case 'choose':
      if (state.page !== 'choose') return state
      return {
        route: action.route,
        page: 'choose',
        appComplete: false,
        answerVisible: false,
      }
    case 'app-status':
      if (state.page !== 'app' || state.appComplete === action.complete)
        return state
      return { ...state, appComplete: action.complete }
    case 'reveal':
      return state.page === 'answer' || state.page === 'check'
        ? { ...state, answerVisible: true }
        : state
    case 'next':
    case 'back': {
      if (action.type === 'next' && !canAdvanceAddition(state)) return state
      const pages = additionPages(state.route, carry)
      const index = pages.indexOf(state.page)
      const page = pages[index + (action.type === 'next' ? 1 : -1)]
      return page ? { ...state, page, answerVisible: false } : state
    }
  }
}

export function additionStorageKey(pathname: string, a: number, b: number) {
  return `addition-flow:v1:${pathname}:${a}+${b}`
}

// 準備の画面で、台本の続きがあるかを決める。最後のページ（たしかめ）まで進んだら、終えたものとして扱う
export function additionFlowStatus(
  raw: string | null,
  carry = false,
): FlowStatus {
  const saved = parseAdditionProgress(raw, carry)
  if (!saved) return 'start'
  if (saved.page === 'check') return 'finished'
  return saved.page === 'read' ? 'start' : 'middle'
}

function parseAdditionProgress(raw: string | null, carry: boolean) {
  try {
    const saved = JSON.parse(raw ?? 'null') as Partial<AdditionProgress> | null
    if (
      saved &&
      (saved.route === null ||
        saved.route === 'physical' ||
        saved.route === 'app') &&
      saved.page &&
      additionPages(saved.route, carry).includes(saved.page)
    )
      return { route: saved.route, page: saved.page }
  } catch {
    // 古い形式や壊れた保存内容は使わない。
  }
  return null
}

export function restoreAdditionProgress(
  raw: string | null,
  carry = false,
): AdditionProgress {
  const saved = parseAdditionProgress(raw, carry)
  // 最後のページ（たしかめ）まで終えたあとは、最初から
  if (!saved || saved.page === 'check') return { ...initialAdditionProgress }
  return {
    route: saved.route,
    page: saved.page,
    // おはじきの盤面は開き直すので、途中の完了状態は引き継がない。
    appComplete: false,
    answerVisible: false,
  }
}
