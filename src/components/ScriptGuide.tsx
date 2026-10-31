import { useCallback, useEffect, useId, useRef, useState } from 'react'
import styles from './ScriptGuide.module.css'

// 一度見たら、同じブラウザでは出さない
const STORAGE_KEY = 'oyaoya:script-guide:v1'

// 台本の使い方。見る場所 → 読む場所 → スワイプ の順に、小さな画面の絵で示す
const FRAMES = [
  {
    focus: 'stage',
    title: ['上のステージを、', 'お子さんと一緒に見ます'],
    lead: 'おはじきや問題の絵が出ます。',
  },
  {
    focus: 'read',
    title: ['下のセリフを、', 'そのまま読み上げます'],
    lead: 'セリフの上の「教え方のポイント」は、押すとたためます。',
  },
  {
    focus: 'swipe',
    title: ['台本は、スワイプで', 'めくって進みます'],
    lead: '左へ：次のページ　右へ：前のページ',
  },
] as const

// 初めて台本を開いたときに出す、使い方の説明（3段）。画面のどこをさわっても次へ進む。
// 出している間は、後ろの台本を操作できないようにする（inert）
export function ScriptGuide() {
  const [frame, setFrame] = useState<number | null>(() => {
    // サーバーでの描画（テスト）では出さない
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(STORAGE_KEY) === 'done' ? null : 0
    } catch {
      // 保存を読めないブラウザでは、毎回出す
      return 0
    }
  })
  const titleId = useId()
  const overlay = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const open = frame !== null

  const finish = useCallback(() => {
    setFrame(null)
    try {
      localStorage.setItem(STORAGE_KEY, 'done')
    } catch {
      // 保存できなくても、この画面では閉じられる
    }
  }, [])

  // 出している間は、同じ台本の中のほかの部品を inert にして、フォーカスが後ろへ行かないようにする。
  // Escape は、どこにフォーカスがあっても閉じる。閉じたら、台本の領域へフォーカスを戻す
  useEffect(() => {
    if (!open) return
    const element = overlay.current
    const parent = element?.parentElement
    const siblings = [...(parent?.children ?? [])].filter(
      (child) => child !== element && !child.hasAttribute('inert'),
    )
    for (const sibling of siblings) sibling.setAttribute('inert', '')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      for (const sibling of siblings) sibling.removeAttribute('inert')
      document.removeEventListener('keydown', onKeyDown)
      // 台本の領域（なければ、準備へ戻る「×」）へフォーカスを戻す
      if (parent?.isConnected)
        (
          parent.querySelector<HTMLElement>(
            '[aria-roledescription="カルーセル"]',
          ) ?? parent.querySelector<HTMLElement>('button')
        )?.focus({ preventScroll: true })
    }
  }, [open, finish])
  useEffect(() => {
    if (frame !== null) button.current?.focus({ preventScroll: true })
  }, [frame])

  if (frame === null) return null
  const last = frame === FRAMES.length - 1
  const next = () => (last ? finish() : setFrame(frame + 1))
  const { focus, title, lead } = FRAMES[frame]

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={overlay}
      onClick={next}
    >
      <div className={styles.picture} aria-hidden="true">
        <div className={styles.phone} data-focus={focus}>
          <div className={styles.pages}>
            <i data-part="stage" />
            <b data-part="read" />
            <b data-part="read" />
            <b data-part="read" />
          </div>
        </div>
        {focus === 'swipe' && <span className={styles.finger} />}
      </div>
      <h2 id={titleId}>
        {title[0]}
        <br />
        {title[1]}
      </h2>
      <p className={styles.lead}>{lead}</p>
      <div className={styles.dots} aria-hidden="true">
        {FRAMES.map((_, i) => (
          <i key={i} data-on={i === frame} />
        ))}
      </div>
      <button className={styles.next} type="button" ref={button}>
        {last ? 'さわって閉じる' : 'さわってつぎへ'}
      </button>
    </div>
  )
}
