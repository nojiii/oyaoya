import { useId, useState } from 'react'
import { arithmetic, type ArithmeticMode } from '../problems/arithmetic'
import { TeachingScript } from './TeachingScript'
import styles from './TeachingScript.module.css'
import { LessonVisual } from './LessonVisual'
import { AdditionFlow } from './AdditionFlow'

interface Props {
  mode: ArithmeticMode
  initial: readonly [number, number]
  apples?: boolean
  additionFlow?: boolean
}

export function ArithmeticLesson({
  mode,
  initial,
  apples = false,
  additionFlow = false,
}: Props) {
  const [values, setValues] = useState(initial)
  const [draft, setDraft] = useState(initial.map(String))
  const [error, setError] = useState('')
  const [activeNumber, setActiveNumber] = useState<number | null>(null)
  const [replaceNumber, setReplaceNumber] = useState(true)
  const id = useId()
  const [a, b] = values
  const model = arithmetic(mode, a, b)
  const isSubtract = mode === 'sub' || mode === 'borrow'
  const symbol = isSubtract ? '−' : mode === 'times' ? '×' : '+'
  const applyNumbers = () => {
    try {
      const normalized = draft.map((value) => value.normalize('NFKC').trim())
      if (normalized.some((value) => !/^\d+$/.test(value)))
        throw new Error('数字を入力してください。')
      const next: [number, number] = [
        Number(normalized[0]),
        Number(normalized[1]),
      ]
      arithmetic(mode, ...next)
      if (next[0] !== a || next[1] !== b) setValues(next)
      setDraft(next.map(String))
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '数字を確認してください。',
      )
    }
  }
  // 入力欄からフォーカスを外すと、form の onBlur で数字が反映される。
  // フォーカスを残すと、同じ欄を再タップしても onFocus が走らず数字パッドが出ない。
  const finishEditing = () => {
    if (document.activeElement instanceof HTMLInputElement)
      document.activeElement.blur()
    else applyNumbers()
    setActiveNumber(null)
  }
  const renderEditor = (inSpeech = false) => (
    <form
      className={styles.inlineQuestion}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          applyNumbers()
          setActiveNumber(null)
        }
      }}
      onSubmit={(event) => event.preventDefault()}
    >
      {apples && !inSpeech && (
        <p>あかいりんごと、あおいりんご。あわせて何こかな？</p>
      )}
      <div className={inSpeech ? styles.editableSpeech : styles.equation}>
        {[0, 1].map((index) => (
          <span className={styles.operand} key={index}>
            {inSpeech && apples
              ? index === 0
                ? 'あかいりんごが'
                : 'こ、あおいりんごが'
              : index === 1 && <span aria-hidden="true">{symbol}</span>}
            <input
              aria-label={
                index === 0
                  ? '最初の数'
                  : isSubtract
                    ? '引く数'
                    : mode === 'times'
                      ? 'いくつ分'
                      : '足す数'
              }
              type="text"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              value={draft[index]}
              style={
                inSpeech
                  ? { width: `${Math.max(1, draft[index].length) + 0.5}ch` }
                  : undefined
              }
              onKeyDown={(event) => {
                // 入力欄が2つで送信ボタンがないフォームは、Enter で送信されない
                if (event.key !== 'Enter' || event.nativeEvent.isComposing)
                  return
                event.preventDefault()
                finishEditing()
              }}
              onFocus={(event) => {
                event.currentTarget.select()
                setActiveNumber(index)
                setReplaceNumber(true)
              }}
              onChange={(event) => {
                setDraft(
                  draft.map((value, i) =>
                    i === index ? event.target.value : value,
                  ),
                )
                setError('')
                setReplaceNumber(false)
              }}
              aria-invalid={!!error}
              aria-describedby={
                id + '-help' + (error ? ' ' + id + '-error' : '')
              }
            />
          </span>
        ))}
        <span>{inSpeech && apples ? 'こ。あわせて何こかな？' : '= ?'}</span>
      </div>
      <p className={styles.editorHelp} id={id + '-help'}>
        数字をタップして変更できます。
      </p>
      {activeNumber !== null && (
        <div
          className={styles.numberPad}
          role="group"
          aria-label="数字キーボード"
        >
          <p>{activeNumber === 0 ? '最初の数' : '2つ目の数'}を変更</p>
          <div className={styles.numberPadKeys}>
            {[
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              'クリア',
              '0',
              '⌫',
            ].map((key) => (
              <button
                key={key}
                type="button"
                aria-label={key === '⌫' ? '1文字削除' : key}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  setDraft(
                    draft.map((value, index) =>
                      index !== activeNumber
                        ? value
                        : key === 'クリア'
                          ? ''
                          : key === '⌫'
                            ? value.slice(0, -1)
                            : replaceNumber
                              ? key
                              : value + key,
                    ),
                  )
                  setReplaceNumber(false)
                  setError('')
                }}
              >
                {key}
              </button>
            ))}
          </div>
          <button
            className={styles.numberPadDone}
            type="button"
            onPointerDown={(event) => event.preventDefault()}
            onClick={finishEditing}
          >
            確定
          </button>
        </div>
      )}
      {error && (
        <p id={id + '-error'} className={styles.editorError} role="alert">
          {error}
        </p>
      )}
    </form>
  )
  const question = apples
    ? `あかいりんごが${a}こ、あおいりんごが${b}こ。あわせて何こかな？`
    : model.question
  return (
    <TeachingScript
      key={`${mode}-${a}-${b}`}
      flow={
        additionFlow ? (
          <AdditionFlow a={a} b={b} editor={renderEditor()} />
        ) : undefined
      }
      editor={renderEditor()}
      counters={{ mode, a, b }}
      renderVisual={(step) => (
        <LessonVisual problem={{ mode, a, b }} step={step} />
      )}
      prepare={{
        counterChoice: additionFlow,
        goal: `${model.equation} の解き方を、画面のおはじきを動かしながら教えます。`,
        materials: [
          `おはじきやブロックを${isSubtract ? a : mode === 'times' ? a * b : a + b}こ`,
          '紙と鉛筆',
        ],
        point:
          !additionFlow && (mode === 'carry' || mode === 'add') && a + b >= 10
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
        sayContent: renderEditor(true),
        parentNote: isSubtract
          ? '**最初の数と引く数**を指さし、何こから何こを取るか確かめましょう。\n\n答えを急がず、**思い浮かべる時間**を作ります。'
          : mode === 'times'
            ? '**1つ分といくつ分**を、指さして確かめましょう。\n\n難しければ身近なものを、**同じ数ずつ**並べて見せます。'
            : mode === 'add' && a + b < 10
              ? 'まずは問題を、**一緒に読みましょう**。\n\n答えを急がず、お子さんが**考える時間**を作ります。'
              : '**2つの数を指さして**、合わせた数を考える問題だと確認します。\n\n先に答えを言わず、お子さんが**考える時間**を作りましょう。',
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
