import type { ReactNode } from 'react'
import type { CounterProblem } from './CounterDisplay'
import { VisualPlayground } from './VisualPlayground'
import styles from './TeachingScript.module.css'

export interface TeachingStepContent {
  say: string
  sayContent?: ReactNode
  label?: string
  parentNote?: string
  counterInvitation?: CounterProblem
  resourceHint?: string
}

export function TeachingStep({ step: beat }: { step: TeachingStepContent }) {
  return (
    <>
      {beat.parentNote && (
        <section className={styles.parentNote}>
          <h3>
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
            教え方のポイント
          </h3>
          <p>{beat.parentNote}</p>
        </section>
      )}
      {beat.say && (
        <div className={styles.speech}>
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
            <span>お子さんに声に出して読もう</span>
          </h2>
          <img className={styles.mascot} src="/mascot.png" alt="" />
          <div>
            {beat.label && <p className={styles.label}>{beat.label}</p>}
            <div className={styles.bubble}>{beat.sayContent ?? beat.say}</div>
          </div>
        </div>
      )}
      {beat.counterInvitation && (
        <CounterInvitation problem={beat.counterInvitation} />
      )}
      {beat.resourceHint && (
        <p className={styles.resourceHint}>{beat.resourceHint}</p>
      )}
    </>
  )
}

function CounterInvitation({ problem }: { problem: CounterProblem }) {
  const description =
    problem.mode === 'sub' || problem.mode === 'borrow'
      ? 'おはじき画面で' +
        problem.a +
        'こから' +
        problem.b +
        'こを取り分け、残った数を確かめましょう。'
      : problem.mode === 'count'
        ? 'おはじき画面で1こずつ触り、数えたものを確かめましょう。'
        : 'おはじきを' +
          problem.a +
          'こと' +
          problem.b +
          'こに分けて並べ、2つの数を目で確認しましょう。'
  return (
    <aside className={styles.counterGuide} aria-label="おはじきの案内">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="4" fill="#ba8051" />
        <circle cx="16" cy="15" r="4" fill="#8a9870" />
        <circle cx="7" cy="17" r="3" fill="#d6b18a" />
      </svg>
      <div>
        <p>{description}</p>
        <VisualPlayground
          problem={problem}
          showIntroduction
          step={1}
          showOpenHint={false}
        >
          <span className={styles.counterGuideButton}>おはじきを使う</span>
        </VisualPlayground>
      </div>
    </aside>
  )
}
