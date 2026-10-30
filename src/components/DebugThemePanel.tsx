import { useId, useState } from 'react'
import { DEBUG_THEMES, getDebugTheme, setDebugTheme } from '../debugTheme'
import styles from './DebugThemePanel.module.css'

// デバッグモード（URL に ?debug）のときだけ、画面の左下に出す色の切り替え。
// 台本の画面でも準備の画面でも出し、押すと色の一覧が開く
export function DebugThemePanel() {
  const [theme, setTheme] = useState(getDebugTheme)
  const [open, setOpen] = useState(false)
  const panelId = useId()
  if (!theme) return null

  const choose = (id: string | null) => {
    setDebugTheme(id)
    setTheme(id)
  }
  const selected = DEBUG_THEMES.find((item) => item.id === theme)
  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="台本の色を変える（デバッグ）"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.dot} />
      </button>
      {open && (
        <div
          className={styles.panel}
          id={panelId}
          role="group"
          aria-label="台本の色（デバッグ）"
        >
          <p className={styles.heading}>
            台本の色<span className={styles.name}>{selected?.name}</span>
          </p>
          <div className={styles.swatches}>
            {DEBUG_THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.swatch}
                style={{ background: item.color }}
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
          <button
            type="button"
            className={styles.quit}
            onClick={() => choose(null)}
          >
            デバッグを終える
          </button>
        </div>
      )}
    </div>
  )
}
