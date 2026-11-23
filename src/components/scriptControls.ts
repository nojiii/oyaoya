import { createContext, useContext } from 'react'

// 台本の中の部品から、「終わる」で準備の画面へ戻るための操作（TeachingScript が渡す。幕を下ろしてから戻る）。
// reset は、幕で隠れている間にすること（途中で終えるときに、保存した進み具合を消す など）。
// reset は { reset } の形で渡す。onClick={finish} のように押した情報がそのまま渡っても、reset とは取り違えない。
// 台本だけを描くとき（テストなど）は、reset だけをすぐに行う
export interface FinishOptions {
  reset?: () => void
}

export const ScriptControls = createContext<{
  finish: (options?: FinishOptions) => void
}>({
  finish: (options) => options?.reset?.(),
})

export function useScriptControls() {
  return useContext(ScriptControls)
}
