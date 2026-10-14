import { useState } from 'react'
import styles from './StumbleSupport.module.css'

interface SupportAction {
  doing: string
  say: string
}

export interface StumbleState {
  id: string
  label: string
  situation: string
  first: SupportAction
  hints: SupportAction[]
  avoid: string[]
  alternative: string[]
}

function SupportSession({ state }: { state: StumbleState }) {
  const [level, setLevel] = useState(0)
  const [completed, setCompleted] = useState(false)

  return (
    <div className={styles.detail}>
      <p>{state.situation}</p>
      <div aria-live="polite" aria-atomic="true">
        {completed ? (
          <p className={styles.action}>
            できました。お子さんの考え方を認めて、次の問題へ進みましょう。
          </p>
        ) : (
          <>
            {[state.first, ...state.hints.slice(0, level)].map(
              (action, index) => (
                <div className={styles.action} key={action.doing}>
                  <h3>{index === 0 ? '親がまずすること' : `ヒント${index}`}</h3>
                  <p>{action.doing}</p>
                  <blockquote>{action.say}</blockquote>
                </div>
              ),
            )}
            {level === state.hints.length && (
              <p>
                親子で一緒に動かしながら確認しましょう。「一緒にやりながら確かめてみよう」
              </p>
            )}
          </>
        )}
      </div>
      {!completed && (
        <>
          <div className={styles.columns}>
            <div>
              <h3>これは避けよう</h3>
              <ul>
                {state.avoid.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>代わりにこうする</h3>
              <ul>
                {state.alternative.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className={styles.buttons}>
            <button type="button" onClick={() => setCompleted(true)}>
              できた！
            </button>
            {level < state.hints.length && (
              <button type="button" onClick={() => setLevel(level + 1)}>
                まだ難しそう
              </button>
            )}
          </div>
        </>
      )}
      {completed && (
        <button
          type="button"
          onClick={() => {
            setCompleted(false)
            setLevel(0)
          }}
        >
          もう一度確認する
        </button>
      )}
    </div>
  )
}

export function StumbleSupport({ states }: { states: StumbleState[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = states.find((state) => state.id === selectedId)

  return (
    <section className="step">
      <h2>つまずいたとき</h2>
      <p>今のお子さんの様子を選んでください。</p>
      <div className={styles.choices}>
        {states.map((state) => (
          <button
            type="button"
            key={state.id}
            aria-pressed={selectedId === state.id}
            onClick={() => setSelectedId(state.id)}
          >
            {state.label}
          </button>
        ))}
      </div>
      {selected && <SupportSession key={selected.id} state={selected} />}
      {selected && (
        <button
          className={styles.reset}
          type="button"
          onClick={() => setSelectedId(null)}
        >
          別の状態を選ぶ
        </button>
      )}
    </section>
  )
}
