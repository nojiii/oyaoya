import { useCallback, useEffect, useReducer, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { TeachingPoints } from './TeachingPoints'
import { SpokenWords } from './SpokenWords'
import { LessonSlides, type LessonSlide } from './LessonSlides'
import { Oyajii } from './Oyajii'
import { useScriptControls } from './scriptControls'
import { VisualPlayground } from './VisualPlayground'
import {
  additionCheck,
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

// ステージに置く式。答えのページでは答え（visible）を、問題を出すページでは「？」を、橙の面に出す。
// 答えは押して出すのではなく、ほかのページと同じくスワイプで答えのページへ進んで見る
export function AdditionEquation({
  a,
  b,
  visible,
}: {
  a: number
  b: number
  visible: boolean
}) {
  return (
    <p className={styles.equation}>
      {a} ＋ {b} ＝ <em>{visible ? a + b : '？'}</em>
    </p>
  )
}

// 答えのページの声かけ。お子さんには、前のページ（数える・アプリのおはじき）で「全部で何こ？」と聞いて、もう答えてもらっている。
// 同じことを聞き直さず、初めから答えを出して、お子さんの答えに合わせて声をかける。答えの式はステージ（AdditionEquation）に出す
export function AdditionAnswer({ a, b }: { a: number; b: number }) {
  return (
    <div className={styles.answer}>
      <TeachingPoints
        collapsible
        note={
          'お子さんが前のページで答えた数に合わせて、声をかけましょう。\n\nちがう数を答えたときは、前のページに戻って数え直します。親は数えずに、同じおはじきを**2回数えていないか、飛ばしていないか**を見守りましょう。'
        }
      />
      <SpokenWords title={`「${a + b}」と答えたら`}>
        そう！ {a}こと{b}こを合わせると、全部で{a + b}こになったね！
      </SpokenWords>
      <SpokenWords title="ちがう数を答えたら" minor>
        おしい！ 指でさしながら、もう一回数えてみよう。
      </SpokenWords>
    </div>
  )
}

// たしかめの、ちがう数の問題をひとりで解くページ。式（答えは「？」）はステージ（AdditionEquation）に出す。
// 教え方のポイントはセリフの上に置き、アプリのおはじきで解くときは、おはじき画面（children）をセリフの下に置く。
// お子さんが答えたら、スワイプで答えのページ（AdditionCheckAnswer）へ進む
export function AdditionCheck({
  a,
  b,
  children,
}: {
  a: number
  b: number
  children?: ReactNode
}) {
  return (
    <div className={styles.answer}>
      <TeachingPoints
        collapsible
        note={`親は手を出さず、**見守りましょう**。おはじきを**${a}個と${b}個に分けて並べる → 合わせる → 1個ずつ数える**、が自分でできていれば、解けています。\n\n**お子さんが答えてから**、次のページへ進みます。次のページには、初めから答えが出ています。`}
      />
      <SpokenWords>
        こんどは、{a}たす{b}
        だよ。さっきと同じように、ひとりでやってみよう。できたら、全部で何こか教えてね。
      </SpokenWords>
      {children}
    </div>
  )
}

// たしかめの最後のページ。前のページ（AdditionCheck）でお子さんが答えた数に合わせて声をかけ、「終わる」で準備の画面へ戻る。
// 答えの式はステージ（AdditionEquation）に、初めから出す
export function AdditionCheckAnswer({
  a,
  b,
  onFinish,
}: {
  a: number
  b: number
  onFinish: () => void
}) {
  return (
    <>
      <div className={styles.answer}>
        <TeachingPoints
          collapsible
          note={
            'お子さんが前のページで答えた数に合わせて、声をかけましょう。\n\nちがう数を答えたときは、**どこでつまずいたか**を見ましょう。並べた数がちがうときは、問題を一緒に読み直します。数えまちがいのときは、1個ずつ指さして数え直します。\n\nひとりでできなくても大丈夫です。今日は**一緒にできたこと**をほめて終わりましょう。'
          }
        />
        <SpokenWords title={`「${a + b}」と答えたら`}>
          ひとりでできたね！ {a}こと{b}こを合わせると、全部で{a + b}こだね。
        </SpokenWords>
        <SpokenWords title="ちがう数を答えたら" minor>
          おしい！
          さっきと同じように、おはじきを合わせて、もう一回数えてみよう。
        </SpokenWords>
      </div>
      <button className={styles.finish} type="button" onClick={onFinish}>
        終わる
      </button>
    </>
  )
}

// 数（a・b）は準備の画面で決める。台本の中では変えない
export function AdditionFlow({ a, b }: { a: number; b: number }) {
  // たしかめの最後のページの「終わる」で、準備の画面へ戻る（次に台本を開くと、最初のページから）
  const { finish } = useScriptControls()
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
  // たしかめで、お子さんがひとりで解く問題
  const [c, d] = additionCheck(a, b)
  // 各ページ：上のステージに見るもの（おはじき・式）、下に見出し → 教え方のポイント → セリフ
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
          <TeachingPoints
            collapsible
            note={`「合わせて」の問題なので、片方にもう片方を足すのではなく、**${a}個と${b}個を両手で同時にまん中へ寄せて**、1つにまとめましょう。\n\nお子さんの手で寄せてもらいましょう。`}
          />
          <SpokenWords>
            {a}こと{b}こを、両手で一緒にまん中へ寄せてみようか。
          </SpokenWords>
        </>
      ),
    },
    count: {
      id: 'count',
      title: '全部でいくつになったかな？',
      stage: <CounterTogether a={a} b={b} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={`合わせたおはじきを、**1個ずつ指さしながら**数えましょう。\n\n${count.length ? `「${count.join('、')}」と、1個ずつ対応させます。` : ''}親が先に答えを言わず、お子さんが最後まで数えるのを待ちましょう。\n\n**お子さんが答えてから**、次のページへ進みます。次のページには、初めから答えが出ています。`}
          />
          <SpokenWords>
            1こずつ一緒に数えてみよう！{' '}
            {/* 合計が5以下だと、親が答えまで（5なら答えの直前まで）数えてしまうので、数を言わない */}
            {count.length > 5 && `${count.slice(0, 4).join('、')}……`}
            全部で何こかな？
          </SpokenWords>
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
            おはじきを合わせて、お子さんが何こか答えたら、「答えを確認する」へ進みます。
          </p>
        </>
      ),
    },
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      stage: (
        <>
          {/* 答えのページに来たら、おやじいが喜ぶ */}
          <Oyajii
            className={styles.answerMascot}
            motion={progress.page === 'answer' ? 'correct' : null}
          />
          <AdditionEquation a={a} b={b} visible />
        </>
      ),
      content: <AdditionAnswer a={a} b={b} />,
    },
    // ここから「たしかめ」。答えが合っただけでなく、合わせ方が分かっているかを確かめる
    explain: {
      id: 'explain',
      section: 'たしかめ',
      title: 'どうやって数えたか、聞いてみましょう',
      stage: <CounterTogether a={a} b={b} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              '**2つに分けて → 合わせて → 1個ずつ数えた**ことを、お子さんが自分の言葉で話せるかを見ます。\n\n言葉にしにくければ、**おはじきを指さして**教えてもらっても大丈夫です。合っていても違っていても、最後まで聞いてから「そうやって数えたんだね」と受け止めましょう。'
            }
          />
          <SpokenWords>
            どうやって答えを見つけたの？ おしえてくれる？
          </SpokenWords>
        </>
      ),
    },
    check: {
      id: 'check',
      section: 'たしかめ',
      title: 'ひとりで解いてみましょう',
      stage: <AdditionEquation a={c} b={d} visible={false} />,
      content: (
        <AdditionCheck a={c} b={d}>
          {/* アプリのおはじきで解くときは、ちがう数のおはじき画面を開く。答えはお子さんから聞く */}
          {progress.route === 'app' && (
            <VisualPlayground
              problem={{ mode: 'add', a: c, b: d }}
              step={1}
              showOpenHint={false}
            >
              <span className={styles.openCounters}>おはじき画面を開く</span>
            </VisualPlayground>
          )}
        </AdditionCheck>
      ),
    },
    // たしかめの最後のページ。本編の答えのページと同じく、初めから答えを出す
    checkAnswer: {
      id: 'checkAnswer',
      section: 'たしかめ',
      title: '答えを確認しましょう！',
      stage: <AdditionEquation a={c} b={d} visible />,
      content: <AdditionCheckAnswer a={c} b={d} onFinish={finish} />,
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
