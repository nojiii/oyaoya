import type { ReactNode } from 'react'
import { Oyajii } from './Oyajii'
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

// active は、今出しているページか。出たときに、おやじいが話しかける
export function TeachingStep({
  step: beat,
  active = false,
}: {
  step: TeachingStepContent
  active?: boolean
}) {
  // 教え方のポイントは、読み上げる前に確かめられるよう、セリフの上に置く
  return (
    <>
      {beat.parentNote && (
        <TeachingPoints note={beat.parentNote} collapsible={!!beat.say} />
      )}
      {beat.say && (
        <div className={styles.speech}>
          <div className={styles.speechIntro}>
            <Oyajii className={styles.mascot} motion={active ? 'talk' : null} />
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
      {beat.resourceHint && (
        <p className={styles.resourceHint}>{beat.resourceHint}</p>
      )}
    </>
  )
}
