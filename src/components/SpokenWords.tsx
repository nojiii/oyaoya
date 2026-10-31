import { useId, type ReactNode } from 'react'
import styles from './AdditionFlow.module.css'
import scriptStyles from './TeachingScript.module.css'
import { SpeakingIcon } from './SpeakingIcon'

// 親が子どもに向けて読み上げる文。子どもに見せる文と同じく、数え方は「こ」にそろえる。
// minor は、主のセリフの代わりに言う控えのセリフ（ちがう数を答えたら など）。小さく出す
export function SpokenWords({
  title = 'こう声をかけよう',
  minor = false,
  children,
}: {
  title?: string
  minor?: boolean
  children: ReactNode
}) {
  const heading = useId()
  return (
    <section
      className={styles.spokenWords}
      aria-labelledby={heading}
      data-minor={minor || undefined}
    >
      <h3 id={heading}>{title}</h3>
      <p className={scriptStyles.readAloudText}>
        <SpeakingIcon />
        {children}
      </p>
    </section>
  )
}
