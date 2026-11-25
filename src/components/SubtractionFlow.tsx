import { useCallback, useEffect, useReducer } from 'react'
import { useLocation } from 'react-router'
import { TeachingPoints } from './TeachingPoints'
import { SpokenWords } from './SpokenWords'
import { LessonSlides, type LessonSlide } from './LessonSlides'
import { ContinueToCheck } from './ContinueToCheck'
import { CONTINUE_TO_CHECK_TITLE } from './continueToCheckWords'
import { Oyajii } from './Oyajii'
import { useScriptControls } from './scriptControls'
import { VisualPlayground } from './VisualPlayground'
import { OpenCounters } from './AdditionFlow'
import {
  advanceSubtraction,
  canAdvanceSubtraction,
  restoreSubtractionProgress,
  subtractionCheck,
  subtractionPages,
  subtractionStorageKey,
  type SubtractionPage,
  type SubtractionRoute,
} from './subtractionFlowState'
import styles from './AdditionFlow.module.css'

export function SubtractionCounters({
  a,
  b = 0,
  removed = false,
}: {
  a: number
  b?: number
  removed?: boolean
}) {
  return (
    <div
      className={styles.counterGroups}
      role="img"
      aria-label={
        removed
          ? `残りのおはじきと、取った${b}このおはじき`
          : `おはじきが${a}こ並んでいます`
      }
    >
      {(removed ? [a - b, b] : [a]).map((count, index) => (
        <div className={styles.counterGroup} key={index} aria-hidden="true">
          <div className={styles.pieces}>
            {Array.from({ length: count }, (_, i) => (
              <span key={i} data-green={index === 1} />
            ))}
          </div>
          <span>
            {removed ? (index === 0 ? 'のこり' : `とった${b}こ`) : `${a}こ`}
          </span>
        </div>
      ))}
    </div>
  )
}
function Equation({
  a,
  b,
  visible = false,
}: {
  a: number
  b: number
  visible?: boolean
}) {
  return (
    <p className={styles.equation}>
      {a} − {b} ＝ <em>{visible ? a - b : '？'}</em>
    </p>
  )
}
const BEFORE_ANSWER =
  '**お子さんが答えてから**、次のページへ進みます。次のページには、初めから答えが出ています。'
function Answer({
  a,
  b,
  independent = false,
}: {
  a: number
  b: number
  independent?: boolean
}) {
  return (
    <div className={styles.answer}>
      <TeachingPoints
        collapsible
        note="お子さんが答えた数に合わせて声をかけましょう。ちがう数を答えたときは、前のページに戻ります。**引く数だけ取れたか、残ったものだけを数えたか**を一緒に確かめます。残りがないときは、**0個**であることを確かめましょう。"
      />
      <SpokenWords title={`「${a - b}」と答えたら`}>
        {independent ? 'ひとりでできたね！' : 'そう！'} {a}こから{b}
        ことると、残りは{a - b}こだね。
      </SpokenWords>
      <SpokenWords title="ちがう数を答えたら" minor>
        おしい！ 取ったものは横によけて、残ったおはじきをもう一回数えてみよう。
      </SpokenWords>
    </div>
  )
}
export function SubtractionFlow({ a, b }: { a: number; b: number }) {
  const { finish } = useScriptControls()
  const location = useLocation()
  const storageKey = subtractionStorageKey(location.pathname, a, b)
  const [progress, dispatch] = useReducer(
    advanceSubtraction,
    storageKey,
    (key) => {
      try {
        return restoreSubtractionProgress(sessionStorage.getItem(key))
      } catch {
        return restoreSubtractionProgress(null)
      }
    },
  )
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(progress))
    } catch {
      /* 保存できなくても学習は続けられる。 */
    }
  }, [progress, storageKey])
  const onCompleteChange = useCallback(
    (complete: boolean) => dispatch({ type: 'app-status', complete }),
    [],
  )
  const [c, d] = subtractionCheck(a, b)
  const choices: { route: SubtractionRoute; title: string; text: string }[] = [
    {
      route: 'physical',
      title: '実物のおはじきを使う',
      text: '実物のおはじきを動かしながら、引き算を教えます。',
    },
    {
      route: 'app',
      title: 'アプリのおはじきを使う',
      text: '画面上のおはじきを動かしながら、引き算を教えます。',
    },
  ]
  const slides: Record<SubtractionPage, LessonSlide> = {
    read: {
      id: 'read',
      title: 'まずは問題を読んでみましょう',
      stage: <SubtractionCounters a={a} />,
      content: (
        <>
          <TeachingPoints note="まずは、下の問題をお子さんと**一緒に読みましょう**。最初の数と引く数を指さして確かめます。" />
          <p className={styles.problem}>
            {a} − {b} ＝ ？
          </p>
        </>
      ),
    },
    choose: {
      id: 'choose',
      title: 'どちらの方法で教えますか？',
      content: (
        <>
          <p>
            おはじきを使って、引く数だけ取り、残りを数える様子を一緒に確かめましょう。
          </p>
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
      stage: <SubtractionCounters a={a} />,
      content: (
        <TeachingPoints
          note={`おはじきを**${a}個**並べます。引く数の${b}個を追加する必要はありません。\n\n取ったおはじきを置く場所を、右側に空けておきましょう。${a === 0 ? '\n\n0個なので、おはじきは置きません。' : ''}`}
        />
      ),
    },
    remove: {
      id: 'remove',
      title: '引く数だけ取ってみましょう',
      stage: <SubtractionCounters a={a} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={`並べた${a}個の中から、**${b}個だけ右側へ移す**操作を、お子さんの手でやってもらいましょう。取ったものと残りを離して置きます。${b === 0 ? '\n\n0個引くときは、何も取りません。' : ''}`}
          />
          <SpokenWords>
            {b === 0
              ? `${a}こから0こ取るよ。0こだから、何も取らずにそのままにしておこう。`
              : `${a}このおはじきから、${b}こ取って、みぎによけてみよう。`}
          </SpokenWords>
        </>
      ),
    },
    count: {
      id: 'count',
      title: '残りはいくつになったかな？',
      stage: <SubtractionCounters a={a} b={b} removed />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={`**残ったおはじきだけ**を、1個ずつ指さして数えてもらいましょう。取ったものは数えません。残りがないときは「何もない」を受け止め、0個と伝えます。\n\n${BEFORE_ANSWER}`}
          />
          <SpokenWords>
            取ったものはそのままにして、残ったおはじきを数えてみよう。残りは何こかな？
          </SpokenWords>
        </>
      ),
    },
    app: {
      id: 'app',
      title: 'アプリのおはじきを使いましょう',
      stageFullscreen: false,
      stage: (
        <VisualPlayground
          problem={{ mode: 'sub', a, b }}
          step={1}
          showOpenHint={false}
          onCompleteChange={onCompleteChange}
          onReviewAnswer={() => dispatch({ type: 'next' })}
        >
          <OpenCounters tone="stage">
            {a}個から{b}個のおはじきを取ります
          </OpenCounters>
        </VisualPlayground>
      ),
      content: (
        <>
          <TeachingPoints
            note={`画面上の**${a}個のおはじきから${b}個を右へ動かして**、残りを一緒に確かめましょう。${b === 0 ? '\n\n0個引くときは、動かさずに残りを数えます。' : ''}`}
          />
          <p className={styles.help}>
            お子さんが残りは何こか答えたら、「答えを確認する」へ進みます。
          </p>
        </>
      ),
    },
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      stage: (
        <>
          <Oyajii
            className={styles.answerMascot}
            motion={progress.page === 'answer' ? 'correct' : null}
          />
          <Equation a={a} b={b} visible />
        </>
      ),
      content: <Answer a={a} b={b} />,
    },
    more: {
      id: 'more',
      title: CONTINUE_TO_CHECK_TITLE,
      content: <ContinueToCheck storageKey={storageKey} />,
    },
    explain: {
      id: 'explain',
      section: 'たしかめ',
      title: 'どうやって数えたか、聞いてみましょう',
      stage: <SubtractionCounters a={a} b={b} removed />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note="**最初の数を並べて → 引く数だけ取って → 残りを数えた**ことを、自分の言葉で話せるか見ます。言葉にしにくければ、おはじきを指さして教えてもらっても大丈夫です。最後まで聞いてから受け止めましょう。"
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
      stage: <Equation a={c} b={d} />,
      content: (
        <div className={styles.answer}>
          <TeachingPoints
            collapsible
            note={`親は手を出さず、**見守りましょう**。${c}個を並べ、${d}個を取り、残りだけを数えられるか確かめます。\n\n${BEFORE_ANSWER}`}
          />
          <SpokenWords>
            こんどは、{c}ひく{d}
            だよ。さっきと同じように、ひとりでやってみよう。できたら、残りは何こか教えてね。
          </SpokenWords>
          {progress.route === 'app' && (
            <div className={styles.pageCounters}>
              <VisualPlayground
                problem={{ mode: 'sub', a: c, b: d }}
                step={1}
                showOpenHint={false}
              >
                <OpenCounters tone="page">
                  {c}個から{d}個のおはじきを、ひとりで取ってもらいます
                </OpenCounters>
              </VisualPlayground>
            </div>
          )}
        </div>
      ),
    },
    checkAnswer: {
      id: 'checkAnswer',
      section: 'たしかめ',
      title: '答えを確認しましょう！',
      stage: <Equation a={c} b={d} visible />,
      content: (
        <>
          <Answer a={c} b={d} independent />
          <p className={styles.help}>
            ひとりでできなくても大丈夫です。今日は一緒にできたことをほめて終わりましょう。
          </p>
          <button
            className={styles.finish}
            type="button"
            onClick={() => finish()}
          >
            終わる
          </button>
        </>
      ),
    },
  }
  return (
    <LessonSlides
      label="引き算の台本"
      slides={subtractionPages(progress.route).map((page) => slides[page])}
      currentId={progress.page}
      totalKnown={progress.route !== null}
      canNext={canAdvanceSubtraction(progress)}
      onNext={() => dispatch({ type: 'next' })}
      onBack={() => dispatch({ type: 'back' })}
    />
  )
}
