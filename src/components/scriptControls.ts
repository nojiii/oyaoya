import { createContext, useContext } from 'react'

// 台本の中の部品から、「終わる」で準備の画面へ戻るための操作（TeachingScript が渡す。幕を下ろしてから戻る）。
// reset は、幕で隠れている間にすること（途中で終えるときに、保存した進み具合を消す など）。
// reset は { reset } の形で渡す。onClick={finish} のように押した情報がそのまま渡っても、reset とは取り違えない。
// 台本だけを描くとき（テストなど）は、reset だけをすぐに行う。
// startFrom は、台本をどこから始めるか。準備の画面から開いたときは、保存した続きを使わない
//   'start' … 「台本をはじめる」で開いた。最初のページから
//   'check' … 「わかる」で開いた。たしかめの問題から
//   'saved' … 台本を開いたまま読み直した（再読み込み）。保存した続きから
export interface FinishOptions {
  reset?: () => void
}

export type StartFrom = 'start' | 'check' | 'saved'

export const ScriptControls = createContext<{
  finish: (options?: FinishOptions) => void
  startFrom: StartFrom
}>({
  finish: (options) => options?.reset?.(),
  startFrom: 'saved',
})

export function useScriptControls() {
  return useContext(ScriptControls)
}
