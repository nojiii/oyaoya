import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
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
  const doneButton = useRef<HTMLButtonElement>(null)
  const retryButton = useRef<HTMLButtonElement>(null)

  // 押したボタンが消えるときは、残るボタンへフォーカスを移して、キーボードで操作している人の位置を保つ
  const complete = () => {
    flushSync(() => setCompleted(true))
    retryButton.current?.focus()
  }
  const showNextHint = () => {
    flushSync(() => setLevel(level + 1))
    if (level + 1 === state.hints.length) doneButton.current?.focus()
  }
  const retry = () => {
    flushSync(() => {
      setCompleted(false)
      setLevel(0)
    })
    doneButton.current?.focus()
  }

  return (
    <div className={styles.detail}>
      <p>{state.situation}</p>
      {/* 追加された部分だけを読み上げる（aria-atomic を付けると、それまでの手順も毎回読み直される） */}
      <div aria-live="polite">
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
            <button type="button" ref={doneButton} onClick={complete}>
              できた！
            </button>
            {level < state.hints.length && (
              <button type="button" onClick={showNextHint}>
                まだ難しそう
              </button>
            )}
          </div>
        </>
      )}
      {completed && (
        <button type="button" ref={retryButton} onClick={retry}>
          もう一度確認する
        </button>
      )}
    </div>
  )
}

export function StumbleSupport({ states }: { states: StumbleState[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = states.find((state) => state.id === selectedId)
  const choices = useRef<HTMLDivElement>(null)

  // 選び直すときは、さっき選んでいた選択肢へフォーカスを戻す
  const reset = () => {
    const index = states.findIndex((state) => state.id === selectedId)
    flushSync(() => setSelectedId(null))
    choices.current?.querySelectorAll('button')[index]?.focus()
  }

  return (
    <section className="step">
      <h2>つまずいたとき</h2>
      <p>今のお子さんの様子を選んでください。</p>
      <div className={styles.choices} ref={choices}>
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
        <button className={styles.reset} type="button" onClick={reset}>
          別の状態を選ぶ
        </button>
      )}
    </section>
  )
}
