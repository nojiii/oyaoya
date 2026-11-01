import { useState } from 'react'

// 使い方のページを最後まで見て（次のページへ進んで）いたら、同じブラウザでは出さない。
// 重ねて出していた説明（v1）を見た人にも、この使い方のページを1回出す
const STORAGE_KEY = 'oyaoya:script-guide:v2'

function seen() {
  // サーバーでの描画（テスト）では出さない
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done'
  } catch {
    // 保存を読めないブラウザでは、毎回出す
    return false
  }
}

export interface ScriptGuide {
  // 台本の前に、使い方のページを置いているか（一度進んだあとも、右へめくれば戻れるように置いておく）
  present: boolean
  // 使い方のページを出しているか
  showing: boolean
  // 使い方のページから、台本の最初のページへ進む
  pass: () => void
  // 台本の最初のページから、使い方のページへ戻る
  revisit: () => void
}

// 台本の使い方のページを、台本の最初のページの前に置くか。
// open は台本を開いているか。開くたびに、そのときの atStart（台本を最初のページから始めるか）で決め直す。
// 途中のページから始めるときは、すでに台本を使ったことがあるので出さない
export function useScriptGuide(open: boolean, atStart: boolean): ScriptGuide {
  const [state, setState] = useState<'showing' | 'passed' | 'none' | null>(null)
  let current = state
  if (open && state === null) {
    current = atStart && !seen() ? 'showing' : 'none'
    setState(current)
  } else if (!open && state !== null) {
    current = null
    setState(null)
  }
  return {
    present: current === 'showing' || current === 'passed',
    showing: current === 'showing',
    pass: () => {
      setState('passed')
      try {
        localStorage.setItem(STORAGE_KEY, 'done')
      } catch {
        // 保存できなくても、この画面では台本へ進める
      }
    },
    revisit: () => setState('showing'),
  }
}

export const GUIDE_TITLE = '台本の使い方'
