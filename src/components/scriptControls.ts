import { createContext, useContext } from 'react'

// 台本の中の部品から、「終わる」で準備の画面へ戻るための操作（TeachingScript が渡す。幕を下ろしてから戻る）。
// reset は、幕で隠れている間にすること（途中で終えるときに、保存した進み具合を消す など）。
// 台本だけを描くとき（テストなど）は、reset だけをすぐに行う
export const ScriptControls = createContext<{
  finish: (reset?: () => void) => void
}>({
  finish: (reset) => reset?.(),
})

export function useScriptControls() {
  return useContext(ScriptControls)
}
