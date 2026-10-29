import type { ReactNode } from 'react'
import { TeachingPoints } from './TeachingPoints'
import styles from './TeachingScript.module.css'

export interface TeachingStepContent {
  say: string
  sayContent?: ReactNode
  label?: string
  // 空行で短い段落に分け、**重要な語句**だけを強調する。
  parentNote?: string
  resourceHint?: string
}

export function TeachingStep({ step: beat }: { step: TeachingStepContent }) {
  return (
    <>
      {beat.say && (
        <div className={styles.speech}>
          <div className={styles.speechIntro}>
            <img
              className={styles.mascot}
              src="/mascot.png"
              alt=""
              draggable={false}
            />
            <h2 className={styles.readAloudHeading}>
              こう
              <wbr />
              声がけしよう
            </h2>
          </div>
          <div className={styles.readingBox}>
            {beat.label && <p className={styles.label}>{beat.label}</p>}
            <div className={styles.readAloudText}>
              {beat.sayContent ?? beat.say}
            </div>
          </div>
        </div>
      )}
      {beat.parentNote && (
        <TeachingPoints note={beat.parentNote} folded={!!beat.say} />
      )}
      {beat.resourceHint && (
        <p className={styles.resourceHint}>{beat.resourceHint}</p>
      )}
    </>
  )
}
