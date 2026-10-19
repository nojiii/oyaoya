import { VisualPlayground } from './VisualPlayground'
import { counterGroups, type CounterProblem } from './counterModel'
import styles from './CounterInvitation.module.css'
export type { CounterProblem } from './counterModel'

export function CounterDisplay({
  problem,
  step,
}: {
  problem: CounterProblem
  step: number
}) {
  const groups =
    problem.mode === 'add' || problem.mode === 'carry'
      ? [{ count: problem.a }, { count: problem.b }]
      : problem.mode === 'sub' || problem.mode === 'borrow'
        ? [{ count: problem.a }]
        : counterGroups(problem, step)
  return (
    <VisualPlayground problem={problem} step={step} showOpenHint={false}>
      <div className={styles.card}>
        <span className={styles.title}>お子さんとおはじきで確かめる</span>
        <span className={styles.description}>
          おはじきだけの画面を開き、一緒に動かせます。
        </span>
        <div className={styles.tray} aria-hidden="true">
          {groups.map((group, index) => (
            <div className={styles.group} key={index}>
              {Array.from({ length: group.count }, (_, i) => (
                <span
                  key={i}
                  className={`${styles.bead} ${index % 2 ? styles.green : ''}`}
                />
              ))}
            </div>
          ))}
          <svg
            className={styles.hand}
            viewBox="0 0 40 48"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M14 24V10a4 4 0 0 1 8 0v11l2-1c2-1 5 0 5 3 4-1 6 1 6 4v8c0 6-4 10-10 10h-3c-4 0-7-2-9-5L5 29c-2-4 3-7 6-4l3 3"
              fill="#fffdf8"
              stroke="#635040"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className={styles.cta}>
          おはじき画面をひらく <span aria-hidden="true">→</span>
        </span>
      </div>
    </VisualPlayground>
  )
}
