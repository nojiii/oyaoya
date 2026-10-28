import { Fragment } from 'react'
import { counterGroups, type CounterProblem } from './counterModel'
import styles from './LessonVisual.module.css'
import { VisualPlayground } from './VisualPlayground'

function Beads({ problem, step }: { problem: CounterProblem; step: number }) {
  const groups = counterGroups(problem, step)
  return (
    <div className={styles.counterGroups}>
      {groups.map((group, i) => (
        <Fragment key={i}>
          {i > 0 && (problem.mode === 'add' || problem.mode === 'carry') && (
            <span className={styles.operator} aria-label="たす">
              ＋
            </span>
          )}
          <div className={styles.counterGroup} data-green={i % 2 === 1}>
            <p>
              {group.label}：{group.count}こ
            </p>
            <div
              className={styles.beads}
              role="img"
              aria-label={`${group.count}こ${group.removed ? '（とったぶん）' : ''}`}
            >
              {Array.from({ length: group.count }, (_, n) => (
                <span
                  className={`${styles.bead} ${group.removed ? styles.removed : ''} ${i % 2 ? styles.second : ''}`}
                  key={n}
                  aria-hidden="true"
                />
              ))}
              {!group.count && <span>0こ</span>}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

export function LessonVisual({
  problem,
  step,
}: {
  problem: CounterProblem
  step: number
}) {
  return (
    <section className={styles.visual} aria-label="教え方の見本">
      <h4>目で見る教え方</h4>
      <VisualPlayground
        problem={problem}
        step={step}
        apples={problem.mode === 'count'}
      >
        <div className={styles.objects}>
          {step > 0 && (
            <>
              <p className={styles.caption}>動かす前</p>
              <Beads problem={problem} step={step - 1} />
              <p className={styles.arrow} aria-label="下の並べ方に変える">
                ↓
              </p>
            </>
          )}
          <p className={styles.caption}>
            {step ? 'このように並べます' : '最初に用意する並べ方'}
          </p>
          <Beads problem={problem} step={step} />
        </div>
      </VisualPlayground>
    </section>
  )
}
