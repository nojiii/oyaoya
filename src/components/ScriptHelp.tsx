import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import styles from './ScriptHelp.module.css'
import { SpeakingIcon } from './SpeakingIcon'

// 台本の右上の「困ったら」。台本どおりに進まなかったときに、困りごとを1つ選ぶと、
// 言い直すセリフ（say）と、すること（do）を1つずつ出す。
// 画面には「困ったら」のボタンだけを置き、中身は押したときだけ下からのシートに出す

export type HelpKind = 'stuck' | 'wrong' | 'unsure' | 'tired'

export interface HelpAnswer {
  // 言い直すときのセリフ
  say?: string
  // 親がすること（1〜2文）
  do: ReactNode
}

// 問題ごとに書き換えたい答えだけを書く（書かなければ、下の共通の答えを出す）
export type ScriptHelpContent = Partial<Record<HelpKind, HelpAnswer>>

// 選ぶ順は、台本で起こりやすい順
const CHOICES: { kind: HelpKind; label: string }[] = [
  { kind: 'stuck', label: '答えられない・だまっている' },
  { kind: 'wrong', label: 'ちがう答えを言った' },
  { kind: 'unsure', label: '何を言えばいいか迷う' },
  { kind: 'tired', label: '疲れた・いやがっている' },
]

// 全問共通の答え。試作のための仮の文で、チームのロールプレイで詰まったところをもとに直していく
const DEFAULTS: Record<HelpKind, HelpAnswer> = {
  stuck: {
    say: 'ゆっくりでいいよ。どこまでわかった？',
    do: '10秒ほど待ちます。それでも止まっていたら、図を指さして、わかるところから一緒にたどります。',
  },
  wrong: {
    say: 'そう考えたんだね。どうやって考えたか教えて？',
    do: 'すぐに正解を言わず、考え方を聞きます。そのあと、図で一緒に確かめます。',
  },
  unsure: {
    say: 'どう思う？',
    do: '迷ったら、答えを言わずに、お子さんの考えを聞けば大丈夫です。',
  },
  tired: {
    say: 'ここまでがんばったね。続きはまた今度にしよう',
    do: '無理に続けなくて大丈夫です。ここで終わっても、準備の画面から続きにもどれます。',
  },
}

export function ScriptHelp({
  help,
  point,
  onStop,
}: {
  help?: ScriptHelpContent
  // 今日の教え方のポイント（準備の画面の prepare.point）。「何を言えばいいか迷う」で一緒に出す
  point?: ReactNode
  // 「今日はここまでにする」。台本を終わって、準備の画面へ戻る（進み具合は残す）
  onStop: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<HelpKind | null>(null)
  const titleId = useId()
  const sheetId = useId()

  // シートを開いている間は、後ろの台本をスクロールさせない
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // 選んだり選び直したりすると、押したボタンが消えるので、見出しへフォーカスを移す
  const heading = useRef<HTMLHeadingElement>(null)
  const chosenBefore = useRef(chosen)
  useEffect(() => {
    if (chosenBefore.current === chosen) return
    chosenBefore.current = chosen
    if (open) heading.current?.focus({ preventScroll: true })
  }, [chosen, open])

  const close = () => dialog.current?.close()
  const choice = CHOICES.find((item) => item.kind === chosen)
  const answer = chosen && { ...DEFAULTS[chosen], ...help?.[chosen] }

  return (
    <>
      <button
        className={styles.trigger}
        type="button"
        ref={trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={sheetId}
        onClick={() => {
          setChosen(null)
          dialog.current?.showModal()
          setOpen(true)
        }}
      >
        困ったら
      </button>
      <dialog
        id={sheetId}
        className={styles.sheet}
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => {
          setOpen(false)
          trigger.current?.focus({ preventScroll: true })
        }}
        // シートの外（暗いところ）を押したら閉じる
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close()
        }}
      >
        <div className={styles.heading}>
          {choice && (
            <button
              className={styles.icon}
              type="button"
              aria-label="困りごとを選び直す"
              onClick={() => setChosen(null)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
          )}
          <h2 id={titleId} ref={heading} tabIndex={-1}>
            {choice ? choice.label : 'どうしましたか？'}
          </h2>
          <button
            className={styles.icon}
            type="button"
            aria-label="閉じて台本にもどる"
            onClick={close}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {answer ? (
          <div className={styles.answer}>
            {answer.say && (
              <p className={styles.say}>
                <SpeakingIcon />
                {answer.say}
              </p>
            )}
            <p className={styles.do}>{answer.do}</p>
            {chosen === 'unsure' && point != null && (
              <div className={styles.point}>
                <b>今日の教え方のポイント</b>
                {point}
              </div>
            )}
            <div className={styles.actions}>
              {chosen === 'tired' && (
                <button
                  className={styles.primary}
                  type="button"
                  onClick={() => {
                    close()
                    onStop()
                  }}
                >
                  今日はここまでにする
                </button>
              )}
              <button
                className={chosen === 'tired' ? undefined : styles.primary}
                type="button"
                onClick={close}
              >
                台本にもどる
              </button>
            </div>
          </div>
        ) : (
          <ul className={styles.choices}>
            {CHOICES.map((item) => (
              <li key={item.kind}>
                <button type="button" onClick={() => setChosen(item.kind)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </dialog>
    </>
  )
}
