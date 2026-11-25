import { createContext, useContext } from 'react'

// 台本の中の部品から、「終わる」で準備の画面へ戻るための操作（TeachingScript が渡す。幕を下ろしてから戻る）。
// reset は、幕で隠れている間にすること（途中で終えるときに、保存した進み具合を消す など）。
// reset は { reset } の形で渡す。onClick={finish} のように押した情報がそのまま渡っても、reset とは取り違えない。
// 台本だけを描くとき（テストなど）は、reset だけをすぐに行う。
// startAtCheck は、準備の画面の「わかる」で台本を開いたか。開いたときは、保存した続きではなく、たしかめの問題から始める
export interface FinishOptions {
  reset?: () => void
}

export const ScriptControls = createContext<{
  finish: (options?: FinishOptions) => void
  startAtCheck: boolean
}>({
  finish: (options) => options?.reset?.(),
  startAtCheck: false,
})

export function useScriptControls() {
  return useContext(ScriptControls)
}
