import { useId } from 'react'
import styles from './TeachingScript.module.css'

// 空行で段落を分け、**で囲んだ語句だけを強調する。
// HTMLとして解釈せず、本文はReactのテキストとして表示する。
// folded のときは、読み上げるセリフを主役にするため、見出しだけを出してたたんでおく。
// たたまないとき（セリフのないページ）は、ページの本文として読ませるので、見出しは読み上げだけで伝える
export function TeachingPoints({
  note,
  folded = false,
}: {
  note: string
  folded?: boolean
}) {
  const headingId = useId()
  const paragraphs = note.split(/\n\s*\n/).filter((text) => text.trim())
  const body = (
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
  )

  if (folded)
    return (
      <details className={styles.parentNote} data-folded>
        <summary className={styles.parentNoteHeader}>
          <h3 id={headingId}>教え方のポイント</h3>
          <span className={styles.parentNoteHint}>
            親が最初に確認するところ
          </span>
        </summary>
        {body}
      </details>
    )

  return (
    <section className={styles.parentNote} aria-labelledby={headingId}>
      <header className={`${styles.parentNoteHeader} ${styles.srOnly}`}>
        <h3 id={headingId}>教え方のポイント</h3>
        <p className={styles.parentNoteHint}>親が最初に確認するところ</p>
      </header>
      {body}
    </section>
  )
}
