import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'
import { useLocation } from 'react-router'
import { TeachingPoints } from './TeachingPoints'
import { LessonSlides, type LessonSlide } from './LessonSlides'
import {
  VisualPlayground,
  type VisualPlaygroundHandle,
} from './VisualPlayground'
import {
  additionPages,
  advanceAddition,
  canAdvanceAddition,
  restoreAdditionProgress,
  type AdditionPage,
  type AdditionRoute,
} from './additionFlowState'
import styles from './AdditionFlow.module.css'
import scriptStyles from './TeachingScript.module.css'

function SpokenWords({ children }: { children: ReactNode }) {
  const heading = useId()
  return (
    <section className={styles.spokenWords} aria-labelledby={heading}>
      <h3 id={heading}>
        <svg
          width="28"
          height="28"
          viewBox="0 0 40 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="13" cy="12" r="5" />
          <path d="M4 32v-4a9 9 0 0 1 18 0v4M26 14q5 6 0 12M31 9q9 11 0 22" />
        </svg>
        こう声をかけよう
      </h3>
      <p className={scriptStyles.readAloudText}>{children}</p>
    </section>
  )
}

function CounterGroups({ a, b }: { a: number; b: number }) {
  return (
    <div
      className={styles.counterGroups}
      role="img"
      aria-label={`おはじきが${a}個と${b}個、別々に並んでいます`}
    >
      {[a, b].map((count, group) => (
        <div className={styles.counterGroup} key={group} aria-hidden="true">
          <div className={styles.pieces}>
            {Array.from({ length: count }, (_, i) => (
              <span key={i} data-green={group === 1} />
            ))}
          </div>
          <span>{count}個</span>
        </div>
      ))}
    </div>
  )
}

export function AdditionAnswer({
  a,
  b,
  visible,
  onReveal,
  onRestart,
}: {
  a: number
  b: number
  visible: boolean
  onReveal: () => void
  onRestart: () => void
}) {
  return (
    <>
      <div aria-live="polite" className={styles.answer}>
        <p className={styles.equation}>
          {a} ＋ {b} ＝ {visible ? a + b : '？'}
        </p>
        {visible && (
          <SpokenWords>
            {a}個と{b}個を合わせると、全部で{a + b}個になったね！
          </SpokenWords>
        )}
      </div>
      {visible ? (
        <button className={styles.secondary} type="button" onClick={onRestart}>
          もう一度はじめる
        </button>
      ) : (
        <button className={styles.primary} type="button" onClick={onReveal}>
          答えを見る
        </button>
      )}
    </>
  )
}

export function AdditionFlow({
  a,
  b,
  editor,
}: {
  a: number
  b: number
  editor: ReactNode
}) {
  const location = useLocation()
  const storageKey = `addition-flow:v1:${location.pathname}:${a}+${b}`
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
  const playground = useRef<VisualPlaygroundHandle>(null)
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
  const choose = (route: AdditionRoute) => {
    // アプリのスライドを操作可能にしてから、既存のおはじき画面を開く。
    flushSync(() => dispatch({ type: 'choose', route }))
    if (route === 'app') playground.current?.open()
  }
  const count = Array.from({ length: a + b }, (_, i) => i + 1)
  const slides: Record<AdditionPage, LessonSlide> = {
    read: {
      id: 'read',
      title: 'まずは問題を読んでみましょう',
      content: (
        <>
          <TeachingPoints note="まずは、下の問題をお子さんと**一緒に読みましょう**。" />
          <div className={styles.problem}>{editor}</div>
        </>
      ),
    },
    choose: {
      id: 'choose',
      title: 'どちらの方法で教えますか？',
      content: (
        <>
          <p>おはじきを使って、数が増える様子を一緒に確かめましょう。</p>
          <div className={styles.choices}>
            <button type="button" onClick={() => choose('physical')}>
              <strong>実物のおはじきを使う</strong>
              <span>実物のおはじきを動かしながら、足し算を教えます。</span>
            </button>
            <button type="button" onClick={() => choose('app')}>
              <strong>アプリのおはじきを使う</strong>
              <span>画面上のおはじきを動かしながら、足し算を教えます。</span>
            </button>
          </div>
          <aside className={styles.note}>
            実物のおはじきがない場合は、アプリのおはじき機能をご利用ください。お子さんにスマートフォンの画面を見せたくない場合は、実物のおはじきがおすすめです。
          </aside>
        </>
      ),
    },
    prepare: {
      id: 'prepare',
      title: 'おはじきを準備しましょう！',
      content: (
        <>
          <TeachingPoints
            note={`おはじきを**${a}個と${b}個に分けて**用意しましょう。\n\n${a}個のグループと${b}個のグループが分かるように、少し離して置いてください。`}
          />
          <CounterGroups a={a} b={b} />
        </>
      ),
    },
    combine: {
      id: 'combine',
      title: 'おはじきを合わせてみましょう',
      content: (
        <>
          <TeachingPoints
            note={`左側におはじきを${a}個置き、右側の${b}個を**1個ずつ左側へ動かして**合わせましょう。`}
          />
          <SpokenWords>
            左の{a}個に、右の{b}個を1個ずつ合わせてみようか。
          </SpokenWords>
        </>
      ),
    },
    count: {
      id: 'count',
      title: '全部でいくつになったかな？',
      content: (
        <>
          <TeachingPoints
            note={`合わせたおはじきを、**1個ずつ指さしながら**数えましょう。\n\n${count.length ? `「${count.join('、')}」と、1個ずつ対応させます。` : ''}親が先に答えを言わず、お子さんが最後まで数えるのを待ちましょう。`}
          />
          <SpokenWords>
            1個ずつ一緒に数えてみよう！{' '}
            {/* 合計が5以下だと、親が答えまで（5なら答えの直前まで）数えてしまうので、数を言わない */}
            {count.length > 5 && `${count.slice(0, 4).join('、')}……`}
            全部で何個かな？
          </SpokenWords>
        </>
      ),
    },
    app: {
      id: 'app',
      title: 'アプリのおはじきを使いましょう',
      content: (
        <>
          <TeachingPoints
            note={`画面上の**${a}個と${b}個のおはじき**を動かして、一緒に確かめましょう。`}
          />
          <VisualPlayground
            ref={playground}
            problem={{ mode: 'add', a, b }}
            step={1}
            showOpenHint={false}
            onCompleteChange={onCompleteChange}
            onReviewAnswer={() => dispatch({ type: 'next' })}
          >
            <span className={styles.openCounters}>おはじき画面を開く</span>
          </VisualPlayground>
          <p className={styles.help}>
            おはじきを合わせたら、「答えを確認する」へ進みます。
          </p>
        </>
      ),
    },
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      content: (
        <AdditionAnswer
          a={a}
          b={b}
          visible={progress.answerVisible}
          onReveal={() => dispatch({ type: 'reveal' })}
          onRestart={() => dispatch({ type: 'restart' })}
        />
      ),
    },
  }
  const nextLabel =
    progress.page === 'choose' || progress.page === 'answer'
      ? undefined
      : progress.page === 'count' || progress.page === 'app'
        ? '答えを確認する'
        : '次へ'
  return (
    <LessonSlides
      slides={additionPages(progress.route).map((page) => slides[page])}
      currentId={progress.page}
      totalKnown={progress.route !== null}
      nextLabel={nextLabel}
      canNext={canAdvanceAddition(progress)}
      onNext={() => dispatch({ type: 'next' })}
      onBack={() => dispatch({ type: 'back' })}
    />
  )
}
