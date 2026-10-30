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

export function TeachingStep({
  step: beat,
  showSpeaker = true,
}: {
  step: TeachingStepContent
  showSpeaker?: boolean
}) {
  return (
    <>
      {beat.parentNote && <TeachingPoints note={beat.parentNote} />}
      {beat.say && (
        <div className={styles.speech}>
          {showSpeaker && (
            <div className={styles.speechIntro}>
              <img className={styles.mascot} src="/mascot.png" alt="" />
              <h2 className={styles.readAloudHeading}>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M9 5h18a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H17l-7 5v-5H9a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z"
                    fill="#fff0bd"
                    stroke="#b66b30"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="13" cy="15" r="1.6" fill="#80522f" />
                  <circle cx="23" cy="15" r="1.6" fill="#80522f" />
                  <path
                    d="M14 20q4 4 8 0"
                    stroke="#80522f"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="19" r="2" fill="#efa38b" />
                  <circle cx="26" cy="19" r="2" fill="#efa38b" />
                </svg>
                <span>
                  こう
                  <wbr />
                  声がけしよう
                </span>
              </h2>
            </div>
          )}
          <div className={styles.readingBox}>
            <svg
              className={styles.readAloudIcon}
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="13" cy="12" r="5" />
              <path d="M4 32v-4a9 9 0 0 1 18 0v4" />
              <path d="M26 14q5 6 0 12M31 9q9 11 0 22" />
            </svg>
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
