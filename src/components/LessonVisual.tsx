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

function UnitDiagram({ id, step }: { id: string; step: number }) {
  if (id === 'numbers')
    return (
      <div
        className={styles.apples}
        role="img"
        aria-label={
          step < 2
            ? '5このりんごを左から1つずつ指さす'
            : 'りんご全体を囲み、全部で5こと示す'
        }
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>
            🍎<small>{step > 0 ? n : ''}</small>
          </span>
        ))}
        <p>{step < 2 ? '左から1こずつ指さす →' : '全体を囲んで「5こ」'}</p>
      </div>
    )
  if (id === 'clock' || id === 'time')
    return (
      <svg
        viewBox="0 0 240 220"
        role="img"
        aria-label={
          id === 'time'
            ? step < 2
              ? '長い針が1周すると60分'
              : '12から6への半周が30分'
            : '短い針が3、長い針が12の3時の時計'
        }
      >
        {id === 'time' && (
          <path
            d={
              step < 2
                ? 'M120 20 A80 80 0 1 1 119 20'
                : 'M120 20 A80 80 0 0 1 120 180'
            }
            fill="none"
            stroke="#c8895a"
            strokeWidth="12"
            opacity="0.35"
          />
        )}
        <circle
          cx="120"
          cy="100"
          r="80"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = ((i + 1) * Math.PI) / 6
          return (
            <text
              x={120 + Math.sin(angle) * 65}
              y={105 - Math.cos(angle) * 65}
              textAnchor="middle"
              fontSize="13"
              key={i}
            >
              {i + 1}
            </text>
          )
        })}
        <path
          d={id === 'time' && step >= 2 ? 'M120 100V158' : 'M120 100V42'}
          stroke="#658274"
          strokeWidth="4"
        />
        <path d="M120 100H162" stroke="#b77348" strokeWidth="7" />
        <text x="120" y="208" textAnchor="middle" fontSize="13">
          {id === 'time'
            ? step < 2
              ? '長い針：1周で60分'
              : '長い針：半周で30分'
            : '茶色：短い針 ／ 緑：長い針'}
        </text>
      </svg>
    )
  if (id === 'shape' || id === 'figures') {
    const points =
      id === 'shape'
        ? [
            [120, 20],
            [210, 155],
            [30, 155],
          ]
        : [
            [40, 25],
            [200, 25],
            [200, 155],
            [40, 155],
          ]
    return (
      <svg
        viewBox="0 0 240 205"
        role="img"
        aria-label={
          id === 'shape'
            ? '三角形の3本の辺を番号順になぞる'
            : '四角形の4つの角に番号をつける'
        }
      >
        <polygon
          points={points.map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        {step > 0 &&
          points.map(([x, y], i) => {
            const next = points[(i + 1) % points.length]
            return id === 'shape' ? (
              <g key={i}>
                <line
                  x1={x}
                  y1={y}
                  x2={next[0]}
                  y2={next[1]}
                  stroke={['#b77348', '#658274', '#a67582'][i]}
                  strokeWidth="6"
                />
                <text
                  x={(x + next[0]) / 2 + 8}
                  y={(y + next[1]) / 2 + 18}
                  fontSize="18"
                >
                  {i + 1}
                </text>
              </g>
            ) : (
              <g key={i}>
                <circle cx={x} cy={y} r="8" fill="#b77348" />
                <text x={x + 12} y={y + 8} fontSize="18">
                  {i + 1}
                </text>
              </g>
            )
          })}
        <text x="120" y="200" textAnchor="middle" fontSize="13">
          {id === 'shape' ? '線を1本ずつなぞる' : 'かどに印をつける'}
        </text>
      </svg>
    )
  }
  if (id === 'length')
    return (
      <svg
        viewBox="0 0 260 140"
        role="img"
        aria-label="左端の0にそろえた線Aと線B。Aの方が長い"
      >
        <path d="M35 10V115" stroke="#b77348" strokeDasharray="4 3" />
        <text x="8" y="40">
          A
        </text>
        <path d="M35 35H235" stroke="currentColor" strokeWidth="8" />
        <text x="8" y="85">
          B
        </text>
        <path d="M35 80H155" stroke="#658274" strokeWidth="8" />
        <path d="M35 105H235" stroke="currentColor" />
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <g key={n}>
            <path d={`M${35 + n * 40} 102v10`} stroke="currentColor" />
            <text x={35 + n * 40} y="130" textAnchor="middle" fontSize="12">
              {n}
            </text>
          </g>
        ))}
      </svg>
    )
  return null
}

export function LessonVisual({
  problem,
  unitId,
  step,
}: {
  problem?: CounterProblem
  unitId?: string
  step: number
}) {
  return (
    <section className={styles.visual} aria-label="教え方の見本">
      <h4>目で見る教え方</h4>
      <VisualPlayground
        problem={problem}
        step={step}
        apples={
          (!problem || problem.mode === 'count') &&
          (!unitId || unitId === 'numbers')
        }
        diagram={<UnitDiagram id={unitId ?? 'numbers'} step={step} />}
      >
        {problem && problem.mode !== 'count' ? (
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
        ) : (
          <div className={styles.diagram}>
            <UnitDiagram id={unitId ?? 'numbers'} step={step} />
          </div>
        )}
      </VisualPlayground>
    </section>
  )
}
