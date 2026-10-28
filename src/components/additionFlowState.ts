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

export function restoreAdditionProgress(raw: string | null): AdditionProgress {
  try {
    const saved = JSON.parse(raw ?? 'null') as Partial<AdditionProgress> | null
    if (
      saved &&
      (saved.route === null ||
        saved.route === 'physical' ||
        saved.route === 'app') &&
      saved.page &&
      additionPages(saved.route).includes(saved.page)
    ) {
      return {
        route: saved.route,
        page: saved.page,
        // おはじきの盤面は開き直すので、途中の完了状態は引き継がない。
        appComplete: false,
        answerVisible: false,
      }
    }
  } catch {
    // 古い形式や壊れた保存内容は使わない。
  }
  return { ...initialAdditionProgress }
}
