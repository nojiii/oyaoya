import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { DEBUG_THEMES, getDebugTheme, setDebugTheme } from '../debugTheme'
import styles from './DebugThemePanel.module.css'

// デバッグモード（URL に ?debug）のときだけ、画面の左端の中ほどに出す色の切り替え。
// 台本の画面でも準備の画面でも出し、つまみを押すと色の一覧が開く
export function DebugThemePanel() {
  const [theme, setTheme] = useState(getDebugTheme)
  // 一覧を開いたページ。ページを移ったら閉じる
  const [openOn, setOpenOn] = useState<string | null>(null)
  const { key } = useLocation()
  const open = openOn === key
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  // 開いている間は、一覧の外を押すか Escape で閉じる
  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenOn(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenOn(null)
      // 一覧の中にいたときは、つまみに戻す
      if (root.current?.contains(document.activeElement)) {
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  if (!theme) return null

  const choose = (id: string) => {
    setDebugTheme(id)
    setTheme(id)
  }
  const quit = () => {
    setDebugTheme(null)
    setTheme(null)
    // つまみごと消えるので、ページの本文に移す
    document.querySelector('main')?.focus({ preventScroll: true })
  }
  const selected = DEBUG_THEMES.find((item) => item.id === theme)
  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={styles.trigger}
        ref={trigger}
        aria-label="台本の色を変える（デバッグ）"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpenOn(open ? null : key)}
      >
        <span className={styles.tab}>
          <span className={styles.dot} />
        </span>
      </button>
      {open && (
        <div
          className={styles.panel}
          id={panelId}
          role="group"
          aria-label="台本の色（デバッグ）"
        >
          <p className={styles.heading}>台本の色</p>
          <p className={styles.name}>{selected?.name}</p>
          <div className={styles.swatches}>
            {DEBUG_THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.swatch}
                style={{ backgroundColor: item.color }}
                aria-label={item.name}
                aria-pressed={item.id === theme}
                title={item.name}
                onClick={() => choose(item.id)}
              >
                {item.id === theme && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="m5 12 5 5 9-10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <button type="button" className={styles.quit} onClick={quit}>
            デバッグを終える
          </button>
        </div>
      )}
    </div>
  )
}
