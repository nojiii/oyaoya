import { useId, useState } from 'react'
import { arithmetic, type ArithmeticMode } from '../problems/arithmetic'
import { TeachingScript } from './TeachingScript'
import styles from './TeachingScript.module.css'
import { LessonVisual } from './LessonVisual'

interface Props {
  mode: ArithmeticMode
  initial: readonly [number, number]
  apples?: boolean
}

export function ArithmeticLesson({ mode, initial, apples = false }: Props) {
  const [values, setValues] = useState(initial)
  const [draft, setDraft] = useState(initial.map(String))
  const [error, setError] = useState('')
  const id = useId()
  const [a, b] = values
  const model = arithmetic(mode, a, b)
  const isSubtract = mode === 'sub' || mode === 'borrow'
  const symbol = isSubtract ? '−' : mode === 'times' ? '×' : '+'
  const minA =
    mode === 'borrow' ? 11 : mode === 'carry' || mode === 'times' ? 1 : 0
  const maxA = mode === 'borrow' ? 19 : mode === 'sub' ? 20 : 9
  const minB = mode === 'borrow' || mode === 'carry' || mode === 'times' ? 1 : 0
  const editor = (
    <fieldset className={styles.numberEditor}>
      <legend>問題の数字を入力</legend>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          try {
            const normalized = draft.map((value) =>
              value.normalize('NFKC').trim(),
            )
            if (normalized.some((value) => !value))
              throw new Error('2つの数を入力してください。')
            if (normalized.some((value) => !/^\d+$/.test(value)))
              throw new Error('数字だけを入力してください。')
            const next: [number, number] = [
              Number(normalized[0]),
              Number(normalized[1]),
            ]
            arithmetic(mode, ...next)
            setValues(next)
            setDraft(next.map(String))
            setError('')
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : '数字を確認してください。',
            )
          }
        }}
      >
        <p className={styles.editorHelp} id={`${id}-help`}>
          入力欄をタップし、数字キーボードで変更できます。 最初の数は{minA}〜
          {maxA}、{isSubtract ? '引く数' : '2つ目の数'}は{minB}〜
          {mode === 'sub' ? '最初の数' : 9}です。
        </p>
        <div className={styles.numberFields}>
          {[0, 1].map((index) => (
            <div className={styles.numberField} key={index}>
              <label htmlFor={`${id}-${index}`}>
                {index === 0
                  ? '最初の数'
                  : isSubtract
                    ? '引く数'
                    : mode === 'times'
                      ? 'いくつ分'
                      : '足す数'}
              </label>
              <input
                id={`${id}-${index}`}
                type="text"
                inputMode="numeric"
                required
                autoComplete="off"
                enterKeyHint={index === 0 ? 'next' : 'done'}
                onFocus={(event) => event.currentTarget.select()}
                value={draft[index]}
                aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
                onChange={(event) => {
                  setDraft(
                    draft.map((value, i) =>
                      i === index ? event.target.value : value,
                    ),
                  )
                  setError('')
                }}
              />
            </div>
          ))}
        </div>
        <p className={styles.editorHelp}>
          計算：{draft[0] || '□'} {symbol} {draft[1] || '□'}
        </p>
        {error && (
          <p id={`${id}-error`} className={styles.editorError} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={styles.applyNumbers}>
          この数字で台本を作る
        </button>
      </form>
    </fieldset>
  )
  const question = apples
    ? `あかいりんごが${a}こ、あおいりんごが${b}こ。あわせて何こかな？`
    : model.question
  return (
    <TeachingScript
      key={`${mode}-${a}-${b}`}
      editor={editor}
      counters={{ mode, a, b }}
      renderVisual={(step) => (
        <LessonVisual problem={{ mode, a, b }} step={step} />
      )}
      prepare={{
        goal: `${model.equation} の解き方を、画面のおはじきを動かしながら教えます。`,
        materials: [
          `おはじきやブロックを${isSubtract ? a : mode === 'times' ? a * b : a + b}こ`,
          '紙と鉛筆',
        ],
        point:
          (mode === 'carry' || mode === 'add') && a + b >= 10
            ? `まず${a}を10にします。${b}を${10 - a}と${b - (10 - a)}に分けると考えやすくなります。`
            : 'おはじきを一緒に動かして、数がどう変わるかを確かめます。',
        avoid: [
          '「なんでわからないの？」と言う',
          '一度に全部説明する',
          '答えだけを言って終わる',
        ],
      }}
      question={{
        say: question,
        show: <p>{question}</p>,
        how: 'おはじきの画面を開き、問題の数を指さしながら読み上げます。',
        why: '計算する数と、何をする問題かを確認してから、解き方の説明に入ります。',
        avoid: [
          `最初から「答えは${model.answer}」と言う`,
          '問題を読み終える前に計算を急かす',
        ],
      }}
      turns={model.steps}
    />
  )
}
