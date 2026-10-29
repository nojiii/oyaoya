import { useCallback, useEffect, useReducer } from 'react'
import { useLocation } from 'react-router'
import { TeachingPoints } from './TeachingPoints'
import { SpokenWords } from './SpokenWords'
import { LessonSlides, type LessonSlide } from './LessonSlides'
import { useScriptControls } from './scriptControls'
import { VisualPlayground } from './VisualPlayground'
import {
  additionPages,
  additionStorageKey,
  advanceAddition,
  canAdvanceAddition,
  restoreAdditionProgress,
  type AdditionPage,
  type AdditionRoute,
} from './additionFlowState'
import styles from './AdditionFlow.module.css'

// 2つに分けたおはじき。台本のステージと、準備の画面の図に使う
export function CounterGroups({ a, b }: { a: number; b: number }) {
  return (
    <div
      className={styles.counterGroups}
      role="img"
      aria-label={`おはじきが${a}こと${b}こ、別々に並んでいます`}
    >
      {[a, b].map((count, group) => (
        <div className={styles.counterGroup} key={group} aria-hidden="true">
          <div className={styles.pieces}>
            {Array.from({ length: count }, (_, i) => (
              <span key={i} data-green={group === 1} />
            ))}
          </div>
          <span>{count}こ</span>
        </div>
      ))}
    </div>
  )
}

// 両手で寄せて、1つにまとめたおはじき（数えるページのステージ）
function CounterTogether({ a, b }: { a: number; b: number }) {
  return (
    <div
      className={styles.counterTogether}
      role="img"
      aria-label={`おはじきが${a}こと${b}こ、1つにまとまっています`}
    >
      <div className={styles.pieces} aria-hidden="true">
        {Array.from({ length: a + b }, (_, i) => (
          <span key={i} data-green={i >= a} />
        ))}
      </div>
    </div>
  )
}

// 答えのページのステージに置く式。お子さんが答えたら「？」を押して、答えを見る
export function AdditionEquation({
  a,
  b,
  visible,
  onReveal,
}: {
  a: number
  b: number
  visible: boolean
  onReveal?: () => void
}) {
  return (
    <>
      <p className={styles.equation} aria-live="polite">
        {a} ＋ {b} ＝{' '}
        {visible ? (
          <em>{a + b}</em>
        ) : (
          <button
            className={styles.reveal}
            type="button"
            aria-label="答えを見る"
            onClick={onReveal}
          >
            ？
          </button>
        )}
      </p>
      {!visible && (
        <p className={styles.revealHint}>お子さんが答えたら、「？」をタップ</p>
      )}
    </>
  )
}

export function AdditionAnswer({
  a,
  b,
  visible,
  onFinish,
}: {
  a: number
  b: number
  visible: boolean
  onFinish: () => void
}) {
  // 親が答えを言う前に、お子さんに答えてもらう。答えを見たら、お子さんの答えに合わせて声をかける。
  // 式と「？」はステージ（AdditionEquation）に出す
  return (
    <>
      <div aria-live="polite" className={styles.answer}>
        {visible ? (
          <>
            <SpokenWords title={`「${a + b}」と答えたら`}>
              そう！ {a}こと{b}こを合わせると、全部で{a + b}こになったね！
            </SpokenWords>
            <SpokenWords title="ちがう数を答えたら" minor>
              おしい！ 指でさしながら、もう一回数えてみよう。
            </SpokenWords>
            <TeachingPoints
              folded
              note="ちがう数を答えたときは、前のページに戻って数え直します。親は数えずに、同じおはじきを**2回数えていないか、飛ばしていないか**を見守りましょう。"
            />
          </>
        ) : (
          <>
            <SpokenWords>
              {a}こと{b}こ、合わせて何こだった？
            </SpokenWords>
            <TeachingPoints
              folded
              note="お子さんが答えてから、「？」を押して確かめましょう。**答えを先に言わない**ようにします。"
            />
          </>
        )}
      </div>
      {visible && (
        <button className={styles.finish} type="button" onClick={onFinish}>
          終わる
        </button>
      )}
    </>
  )
}

// 数（a・b）は準備の画面で決める。台本の中では変えない
export function AdditionFlow({ a, b }: { a: number; b: number }) {
  // 答えのページの「終わる」で、準備の画面へ戻る（次に台本を開くと、最初のページから）
  const { toPrepare } = useScriptControls()
  const location = useLocation()
  const storageKey = additionStorageKey(location.pathname, a, b)
  const [progress, dispatch] = useReducer(
    advanceAddition,
    storageKey,
    (key) => {
      try {
        return restoreAdditionProgress(sessionStorage.getItem(key))
      } catch {
        return restoreAdditionProgress(null)
      }
    },
  )
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(progress))
    } catch {
      // 保存できなくても、この画面で学習を続けられる。
    }
  }, [progress, storageKey])
  const onCompleteChange = useCallback((complete: boolean) => {
    dispatch({ type: 'app-status', complete })
  }, [])
  const choices: { route: AdditionRoute; title: string; text: string }[] = [
    {
      route: 'physical',
      title: '実物のおはじきを使う',
      text: '実物のおはじきを動かしながら、足し算を教えます。',
    },
    {
      route: 'app',
      title: 'アプリのおはじきを使う',
      text: '画面上のおはじきを動かしながら、足し算を教えます。',
    },
  ]
  const count = Array.from({ length: a + b }, (_, i) => i + 1)
  // 各ページ：上のステージに見るもの（おはじき・式）、下に見出し → セリフ → 教え方のポイント
  const slides: Record<AdditionPage, LessonSlide> = {
    read: {
      id: 'read',
      title: 'まずは問題を読んでみましょう',
      stage: <CounterGroups a={a} b={b} />,
      content: (
        <>
          <TeachingPoints note="まずは、下の問題をお子さんと**一緒に読みましょう**。" />
          <p className={styles.problem}>
            {a} ＋ {b} ＝ ？
          </p>
        </>
      ),
    },
    choose: {
      id: 'choose',
      title: 'どちらの方法で教えますか？',
      content: (
        <>
          <p>おはじきを使って、2つの数を合わせる様子を一緒に確かめましょう。</p>
          <div className={styles.choices}>
            {choices.map((choice) => (
              <button
                key={choice.route}
                type="button"
                aria-pressed={progress.route === choice.route}
                onClick={() =>
                  dispatch({ type: 'choose', route: choice.route })
                }
              >
                <span>
                  <strong>{choice.title}</strong>
                  <span>{choice.text}</span>
                </span>
                <span className={styles.check} aria-hidden="true">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
          {progress.route === null ? (
            <aside className={styles.note}>
              実物のおはじきがない場合は、アプリのおはじき機能をご利用ください。お子さんにスマートフォンの画面を見せたくない場合は、実物のおはじきがおすすめです。
            </aside>
          ) : (
            <p className={styles.after}>左へスワイプして進みましょう</p>
          )}
        </>
      ),
    },
    prepare: {
      id: 'prepare',
      title: 'おはじきを準備しましょう！',
      stage: <CounterGroups a={a} b={b} />,
      content: (
        <TeachingPoints
          note={`おはじきを**${a}個と${b}個に分けて**用意しましょう。\n\n${a}個のグループと${b}個のグループが分かるように、少し離して置いてください。`}
        />
      ),
    },
    combine: {
      id: 'combine',
      title: 'おはじきを合わせてみましょう',
      stage: <CounterGroups a={a} b={b} />,
      content: (
        <>
          <SpokenWords>
            {a}こと{b}こを、両手で一緒にまん中へ寄せてみようか。
          </SpokenWords>
          <TeachingPoints
            folded
            note={`「合わせて」の問題なので、片方にもう片方を足すのではなく、**${a}個と${b}個を両手で同時にまん中へ寄せて**、1つにまとめましょう。\n\nお子さんの手で寄せてもらいましょう。`}
          />
        </>
      ),
    },
    count: {
      id: 'count',
      title: '全部でいくつになったかな？',
      stage: <CounterTogether a={a} b={b} />,
      content: (
        <>
          <SpokenWords>
            1こずつ一緒に数えてみよう！{' '}
            {/* 合計が5以下だと、親が答えまで（5なら答えの直前まで）数えてしまうので、数を言わない */}
            {count.length > 5 && `${count.slice(0, 4).join('、')}……`}
            全部で何こかな？
          </SpokenWords>
          <TeachingPoints
            folded
            note={`合わせたおはじきを、**1個ずつ指さしながら**数えましょう。\n\n${count.length ? `「${count.join('、')}」と、1個ずつ対応させます。` : ''}親が先に答えを言わず、お子さんが最後まで数えるのを待ちましょう。`}
          />
        </>
      ),
    },
    app: {
      id: 'app',
      title: 'アプリのおはじきを使いましょう',
      stage: (
        <VisualPlayground
          problem={{ mode: 'add', a, b }}
          step={1}
          showOpenHint={false}
          onCompleteChange={onCompleteChange}
          onReviewAnswer={() => dispatch({ type: 'next' })}
        >
          <span className={styles.openCounters}>おはじき画面を開く</span>
        </VisualPlayground>
      ),
      content: (
        <>
          <TeachingPoints
            note={`画面上の**${a}個と${b}個のおはじき**を動かして、一緒に確かめましょう。`}
          />
          <p className={styles.help}>
            おはじきを合わせたら、「答えを確認する」へ進みます。
          </p>
        </>
      ),
    },
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      stage: (
        <>
          <img
            className={styles.answerMascot}
            src="/mascot.png"
            alt=""
            draggable={false}
          />
          <AdditionEquation
            a={a}
            b={b}
            visible={progress.answerVisible}
            onReveal={() => dispatch({ type: 'reveal' })}
          />
        </>
      ),
      content: (
        <AdditionAnswer
          a={a}
          b={b}
          visible={progress.answerVisible}
          onFinish={toPrepare}
        />
      ),
    },
  }
  return (
    <LessonSlides
      label="足し算の台本"
      slides={additionPages(progress.route).map((page) => slides[page])}
      currentId={progress.page}
      totalKnown={progress.route !== null}
      canNext={canAdvanceAddition(progress)}
      onNext={() => dispatch({ type: 'next' })}
      onBack={() => dispatch({ type: 'back' })}
    />
  )
}
