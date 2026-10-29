import { useId, type ReactNode } from 'react'
import styles from './AdditionFlow.module.css'
import scriptStyles from './TeachingScript.module.css'

// 親が子どもに向けて読み上げる文。子どもに見せる文と同じく、数え方は「こ」にそろえる
export function SpokenWords({
  title = 'こう声をかけよう',
  children,
}: {
  title?: string
  children: ReactNode
}) {
  const heading = useId()
  return (
    <section className={styles.spokenWords} aria-labelledby={heading}>
      <h3 id={heading}>
        <svg
          width="28"
          height="28"
          viewBox="0 0 40 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="13" cy="12" r="5" />
          <path d="M4 32v-4a9 9 0 0 1 18 0v4M26 14q5 6 0 12M31 9q9 11 0 22" />
        </svg>
        {title}
      </h3>
      <p className={scriptStyles.readAloudText}>{children}</p>
    </section>
  )
}
