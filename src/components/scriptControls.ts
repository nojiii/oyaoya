import { createContext, useContext } from 'react'

// 台本の中の部品から、「終わる」で準備の画面へ戻るための操作（TeachingScript が渡す。幕を下ろしてから戻る）。
// 台本だけを描くとき（テストなど）は、何もしない。
// startAtCheck は、準備の画面の「わかる」で台本を開いたか。開いたときは、保存した続きではなく、たしかめの問題から始める
export const ScriptControls = createContext<{
  finish: () => void
  startAtCheck: boolean
}>({
  finish: () => {},
  startAtCheck: false,
})

export function useScriptControls() {
  return useContext(ScriptControls)
}
