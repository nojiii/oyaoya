import { createContext, useContext } from 'react'

// 台本の中の部品から、準備の画面へ戻るための操作（TeachingScript が渡す）。
// 台本だけを描くとき（テストなど）は、何もしない
export const ScriptControls = createContext<{ toPrepare: () => void }>({
  toPrepare: () => {},
})

export function useScriptControls() {
  return useContext(ScriptControls)
}
