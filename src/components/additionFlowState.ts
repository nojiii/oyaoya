import type { FlowStatus } from './TeachingScript'

export type AdditionRoute = 'physical' | 'app'
export type AdditionPage =
  'read' | 'choose' | 'prepare' | 'combine' | 'count' | 'app' | 'answer'

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

export function additionPages(route: AdditionRoute | null): AdditionPage[] {
  if (route === 'physical')
    return ['read', 'choose', 'prepare', 'combine', 'count', 'answer']
  if (route === 'app') return ['read', 'choose', 'app', 'answer']
  return ['read', 'choose']
}

export type AdditionAction =
  | { type: 'next' | 'back' | 'reveal' | 'restart' }
  | { type: 'choose'; route: AdditionRoute }
  | { type: 'app-status'; complete: boolean }

export function canAdvanceAddition(state: AdditionProgress) {
  return (
    state.page !== 'choose' &&
    state.page !== 'answer' &&
    (state.page !== 'app' || state.appComplete)
  )
}

export function advanceAddition(
  state: AdditionProgress,
  action: AdditionAction,
): AdditionProgress {
  switch (action.type) {
    case 'restart':
      return { ...initialAdditionProgress }
    case 'choose':
      if (state.page !== 'choose') return state
      return {
        route: action.route,
        page: action.route === 'physical' ? 'prepare' : 'app',
        appComplete: false,
        answerVisible: false,
      }
    case 'app-status':
      if (state.page !== 'app' || state.appComplete === action.complete)
        return state
      return { ...state, appComplete: action.complete }
    case 'reveal':
      return state.page === 'answer' ? { ...state, answerVisible: true } : state
    case 'next':
    case 'back': {
      if (action.type === 'next' && !canAdvanceAddition(state)) return state
      const pages = additionPages(state.route)
      const index = pages.indexOf(state.page)
      const page = pages[index + (action.type === 'next' ? 1 : -1)]
      return page ? { ...state, page, answerVisible: false } : state
    }
  }
}

export function additionStorageKey(pathname: string, a: number, b: number) {
  return `addition-flow:v1:${pathname}:${a}+${b}`
}

// 準備の画面で、台本の続きがあるかを決める。答えのページまで進んだら、終えたものとして扱う
export function additionFlowStatus(raw: string | null): FlowStatus {
  const saved = parseAdditionProgress(raw)
  if (!saved) return 'start'
  if (saved.page === 'answer') return 'finished'
  return saved.page === 'read' ? 'start' : 'middle'
}

function parseAdditionProgress(raw: string | null) {
  try {
    const saved = JSON.parse(raw ?? 'null') as Partial<AdditionProgress> | null
    if (
      saved &&
      (saved.route === null ||
        saved.route === 'physical' ||
        saved.route === 'app') &&
      saved.page &&
      additionPages(saved.route).includes(saved.page)
    )
      return { route: saved.route, page: saved.page }
  } catch {
    // 古い形式や壊れた保存内容は使わない。
  }
  return null
}

export function restoreAdditionProgress(raw: string | null): AdditionProgress {
  const saved = parseAdditionProgress(raw)
  // 答えのページまで終えたあとは、最初から
  if (!saved || saved.page === 'answer') return { ...initialAdditionProgress }
  return {
    route: saved.route,
    page: saved.page,
    // おはじきの盤面は開き直すので、途中の完了状態は引き継がない。
    appComplete: false,
    answerVisible: false,
  }
}
