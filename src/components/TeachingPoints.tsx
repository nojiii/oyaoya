import { useId } from 'react'
import styles from './TeachingScript.module.css'

// 空行で段落を分け、**で囲んだ語句だけを強調する。
// HTMLとして解釈せず、本文はReactのテキストとして表示する。
export function TeachingPoints({ note }: { note: string }) {
  const headingId = useId()
  const paragraphs = note.split(/\n\s*\n/).filter((text) => text.trim())

  return (
    <section className={styles.parentNote} aria-labelledby={headingId}>
      <header className={styles.parentNoteHeader}>
        <svg
          className={styles.pointIcon}
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14 23v-2c0-2-3-3-3-7a7 7 0 0 1 14 0c0 4-3 5-3 7v2z"
            fill="#ffd45c"
            stroke="#9b5b24"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M14 26h8M16 29h4M18 2v2M5 8l2 2M29 8l2-2M3 17h3M30 17h3"
            stroke="#9b5b24"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M15 14a3 3 0 0 1 3-3"
            stroke="#fffdf8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div>
          <h3 id={headingId}>教え方のポイント</h3>
          <p className={styles.parentNoteHint}>親が最初に確認するところ</p>
        </div>
      </header>
      <div className={styles.parentNoteBody}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>
            {paragraph
              .split(/(\*\*[^*]+\*\*)/g)
              .map((part, partIndex) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={partIndex}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                ),
              )}
          </p>
        ))}
      </div>
    </section>
  )
}
