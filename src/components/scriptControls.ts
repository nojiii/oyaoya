import { createContext, useContext } from 'react'

// 台本の中の部品から、「終わる」で準備の画面へ戻るための操作（TeachingScript が渡す。幕を下ろしてから戻る）。
// 台本だけを描くとき（テストなど）は、何もしない
export const ScriptControls = createContext<{ finish: () => void }>({
  finish: () => {},
})

export function useScriptControls() {
  return useContext(ScriptControls)
}
