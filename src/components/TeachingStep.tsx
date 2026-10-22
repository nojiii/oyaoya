import type { CounterProblem } from './CounterDisplay'
import { VisualPlayground } from './VisualPlayground'
import styles from './TeachingScript.module.css'

export interface TeachingStepContent {
  say: string
  label?: string
  parentNote?: string
  afterCounting?: string
  counterInvitation?: CounterProblem
  resourceHint?: string
}

export function TeachingStep({ step: beat }: { step: TeachingStepContent }) {
  return (
    <>
      <h2 className={styles.readAloudHeading}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-6 4V6a2 2 0 0 1 2-2zM7 9h10M7 13h6" />
        </svg>
        お子さんに声に出して読もう
      </h2>
      {beat.parentNote && (
        <section className={styles.parentNote}>
          <h3>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18h6M10 21h4M9 15c0-2-3-3-3-7a6 6 0 0 1 12 0c0 4-3 5-3 7v1H9z" />
            </svg>
            教え方のポイント
          </h3>
          <p>{beat.parentNote}</p>
        </section>
      )}
      {beat.say && (
        <div className={styles.speech}>
          <img className={styles.mascot} src="/mascot.png" alt="" />
          <div>
            {beat.label && <p className={styles.label}>{beat.label}</p>}
            <p className={styles.bubble}>{beat.say}</p>
          </div>
        </div>
      )}
      {beat.counterInvitation && (
        <CounterInvitation problem={beat.counterInvitation} />
      )}
      {beat.resourceHint && (
        <p className={styles.resourceHint}>{beat.resourceHint}</p>
      )}
      {beat.afterCounting && (
        <div className={styles.countingPause}>
          <p className={styles.waitCue}>全部数え終わったら</p>
          <div className={styles.speech}>
            <img className={styles.mascot} src="/mascot.png" alt="" />
            <div>
              <p className={styles.bubble}>{beat.afterCounting}</p>
            </div>
          </div>
        </div>
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
