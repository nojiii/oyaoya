// 台本とデザインの見本。新しい問題を作るときは、このフォルダを丸ごとコピーして書き換える。
// 一覧（curriculum.ts）には置かないので、/problems/sample を直接開いたときだけ見られる。
// 題材（あめのひき算）は書き方を見せるための例で、本番の単元の教え方ではない
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import {
  TeachingScript,
  type FlowStatus,
} from '../../components/TeachingScript'
import { LessonSlides, type LessonSlide } from '../../components/LessonSlides'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { useScriptControls } from '../../components/scriptControls'
// 台本の部品（セリフ・式・方法の選択・終わる など）は、ほかの台本と同じ見た目を使う
import flowStyles from '../../components/AdditionFlow.module.css'
import choiceStyles from '../../components/CountingLesson.module.css'
import styles from './sample.module.css'

export const title = '見本：台本の書き方'

// あめの数。食べる数は、準備の画面で選べる（台本の中では変えない）
const TOTAL = 5
const EATS = [1, 2, 3] as const

// 子どもに読み上げるセリフは1か所にまとめ、台本のページと準備画面の「声かけを先に読んでおく」の両方で使う。
// 話し言葉で1〜2文。数え方は「こ」にそろえる
const words = {
  read: (eat: number) =>
    `あめが${TOTAL}こ あるよ。${eat}こ 食べると、残りは何こかな？`,
  physical: (eat: number) => `${eat}こ、食べるまねをして、よけてみよう。`,
  picture: (eat: number) => `絵のあめを${eat}こ、指でかくしてみよう。`,
  ask: '残りは何こになった？',
  // 答えを見たあとは、お子さんの答えごとに言うセリフを分ける
  right: (eat: number) =>
    `そう！ ${TOTAL}こから${eat}こ食べると、残りは${TOTAL - eat}こだね！`,
  wrong: 'おしい！ 残っているあめを、1こずつ指でさして数えてみよう。',
  explain: 'どうやって答えを見つけたの？ おしえてくれる？',
  check: (eat: number) =>
    `こんどは、あめが${TOTAL + 1}こ。${eat}こ食べると、残りは何こ？ ひとりでやってみよう。`,
  alone: 'ひとりでできたね！',
}

// 台本のページ。左へスワイプで次、右へで前。explain・check が「たしかめ」
const pages = ['read', 'choose', 'take', 'answer', 'explain', 'check'] as const
type Page = (typeof pages)[number]
type Route = 'physical' | 'picture'

interface Progress {
  eat: number
  route: Route | null
  page: Page
}

// 進み具合は、同じタブの中で保存する（準備の画面へ戻ると、台本の部品は作り直されるため）。
// この見本は選んだ方法（route）と食べる数も保存するので、自分で書いている。
// ページの位置だけを保存すればよい台本は、components/pagedFlow.ts を使う（math-easy-1 など）
const storageKey = (pathname: string) => `sample-flow:v1:${pathname}`

function readProgress(raw: string | null, eat: number): Progress | null {
  try {
    const saved = JSON.parse(raw ?? 'null') as Partial<Progress> | null
    const page = pages.find((page) => page === saved?.page)
    // 食べる数を変えたら、続きは使わない
    if (saved?.eat === eat && page)
      return { eat, route: saved.route ?? null, page }
  } catch {
    // 古い形式や壊れた保存内容は使わない
  }
  return null
}

// 準備の画面で、続きがあるかを決める。最後のページまで進んだら、終えたものとして扱う
function flowStatus(raw: string | null, eat: number): FlowStatus {
  const saved = readProgress(raw, eat)
  if (!saved || saved.page === 'read') return 'start'
  return saved.page === 'check' ? 'finished' : 'middle'
}

// ステージに置く絵。eaten こを薄くして、食べたことを示す
function Candies({ total, eaten = 0 }: { total: number; eaten?: number }) {
  return (
    <div
      className={flowStyles.counterTogether}
      role="img"
      aria-label={
        eaten
          ? `あめが${total}こ。そのうち${eaten}こを食べました`
          : `あめが${total}こ、並んでいます`
      }
    >
      <div className={flowStyles.pieces} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i >= total - eaten ? styles.eaten : ''} />
        ))}
      </div>
    </div>
  )
}

// ステージに置く式。お子さんが答えてから「？」を押して、答えを見る
function Equation({
  a,
  b,
  visible,
  onReveal,
}: {
  a: number
  b: number
  visible: boolean
  onReveal: () => void
}) {
  // 「？」を押すとボタンが消えるので、答えの出た式へフォーカスを移す
  const equation = useRef<HTMLParagraphElement>(null)
  const wasVisible = useRef(visible)
  useEffect(() => {
    if (visible && !wasVisible.current)
      equation.current?.focus({ preventScroll: true })
    wasVisible.current = visible
  }, [visible])
  return (
    <>
      <p
        className={flowStyles.equation}
        aria-live="polite"
        ref={equation}
        tabIndex={-1}
      >
        {a} − {b} ＝{' '}
        {visible ? (
          <em>{a - b}</em>
        ) : (
          <button
            className={flowStyles.reveal}
            type="button"
            aria-label="答えを見る"
            onClick={onReveal}
          >
            ？
          </button>
        )}
      </p>
      {!visible && (
        <p className={flowStyles.revealHint}>
          お子さんが答えたら、「？」をタップ
        </p>
      )}
    </>
  )
}

function SampleFlow({ eat }: { eat: number }) {
  // 最後のページの「終わる」で、準備の画面へ戻る
  const { finish } = useScriptControls()
  const key = storageKey(useLocation().pathname)
  const [progress, setProgress] = useState<Progress>(() => {
    try {
      const saved = readProgress(sessionStorage.getItem(key), eat)
      // 最後のページまで終えたあとは、最初から
      if (saved && saved.page !== 'check') return saved
    } catch {
      // 読めないときは、最初から
    }
    return { eat, route: null, page: 'read' }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(progress))
    } catch {
      // 保存できなくても、この画面で学習を続けられる
    }
  }, [key, progress])
  // 「？」で答えを見たか。ページを送ると、見る前に戻す
  const [revealed, setRevealed] = useState(false)
  const { route, page } = progress
  const index = pages.indexOf(page)
  const go = (next: Page | undefined) => {
    if (!next) return
    setProgress({ ...progress, page: next })
    setRevealed(false)
  }
  // 選ぶまで・答えを見るまでは進めない。最後のページから先はない
  const canNext =
    page === 'choose'
      ? route !== null
      : page === 'answer'
        ? revealed
        : page !== 'check'

  const choices: { route: Route; title: string; text: string }[] = [
    {
      route: 'physical',
      title: '実物のお菓子を使う',
      text: 'お菓子やおはじきを動かしながら教えます。',
    },
    {
      route: 'picture',
      title: '絵を使う',
      text: '画面のあめの絵を指でかくしながら教えます。',
    },
  ]

  // 1ページは、上から「ステージ（見るもの）→ 見出し → 教え方のポイント（開いておき、押すとたためる）→ セリフ」。
  // stage を書かないページは、キャラクターが出る。section を書くと、見出しの上に札が出る
  const slides: Record<Page, LessonSlide> = {
    // セリフのないページ：教え方のポイントを、たたまずに本文として出す
    read: {
      id: 'read',
      title: 'まずは問題を読んでみましょう',
      stage: <Candies total={TOTAL} />,
      content: (
        <>
          <TeachingPoints note="下の問題を、お子さんと**一緒に読みましょう**。" />
          <p className={flowStyles.problem}>{words.read(eat)}</p>
        </>
      ),
    },
    // 選ぶページ：選んでもページは進まず、選んだあとにスワイプで進む
    choose: {
      id: 'choose',
      title: 'どちらの方法で教えますか？',
      content: (
        <>
          <div className={flowStyles.choices}>
            {choices.map((choice) => (
              <button
                key={choice.route}
                type="button"
                aria-pressed={route === choice.route}
                onClick={() =>
                  setProgress({ ...progress, route: choice.route })
                }
              >
                <span>
                  <strong>{choice.title}</strong>
                  <span>{choice.text}</span>
                </span>
                <span className={flowStyles.check} aria-hidden="true">
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
          {route !== null && (
            <p className={flowStyles.after}>左へスワイプして進みましょう</p>
          )}
        </>
      ),
    },
    // セリフのあるページ：教え方のポイントは、読み上げる前に確かめられるようセリフの上に置く（collapsible で、たためるようにする）。
    // 選んだ方法でセリフを変えるときは、ページを分けずに文だけを変える
    take: {
      id: 'take',
      title: 'あめを食べてみましょう',
      stage: <Candies total={TOTAL} eaten={eat} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={`食べた${eat}個は、**残りと混ざらないように**離れた場所によけましょう。\n\nよけるのは、お子さんの手でやってもらいます。`}
          />
          <SpokenWords>
            {route === 'picture' ? words.picture(eat) : words.physical(eat)}
          </SpokenWords>
        </>
      ),
    },
    // 答えのページ：答えは先に言わず、お子さんが答えてから「？」で見る。
    // 見たあとは、答えごとのセリフを出す（主のセリフの代わりに言うものは minor で小さく）
    answer: {
      id: 'answer',
      title: '残りを確認しましょう！',
      stage: (
        <Equation
          a={TOTAL}
          b={eat}
          visible={revealed}
          onReveal={() => setRevealed(true)}
        />
      ),
      content: (
        <div className={flowStyles.answer} aria-live="polite">
          {revealed ? (
            <>
              <TeachingPoints
                collapsible
                note={
                  'ちがう数を答えたときは、前のページに戻って、よけたあめと残りを分け直します。\n\n親は数えずに、**残りだけを数えているか**を見守りましょう。'
                }
              />
              <SpokenWords title={`「${TOTAL - eat}」と答えたら`}>
                {words.right(eat)}
              </SpokenWords>
              <SpokenWords title="ちがう数を答えたら" minor>
                {words.wrong}
              </SpokenWords>
            </>
          ) : (
            <>
              <TeachingPoints
                collapsible
                note="お子さんが答えてから、「？」を押して確かめましょう。**答えを先に言わない**ようにします。"
              />
              <SpokenWords>{words.ask}</SpokenWords>
            </>
          )}
        </div>
      ),
    },
    // ここから「たしかめ」。答えが合ったかだけでなく、解き方が身についたかを確かめる。
    // 教え方のポイントには、できているかを見分けるところ（親が見るところ）を書く
    explain: {
      id: 'explain',
      section: 'たしかめ',
      title: 'どうやって数えたか、聞いてみましょう',
      stage: <Candies total={TOTAL} eaten={eat} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              '**食べた分をよけて → 残りだけを数えた**ことを、お子さんが自分の言葉で話せるかを見ます。\n\n言葉にしにくければ、指さしで教えてもらっても大丈夫です。'
            }
          />
          <SpokenWords>{words.explain}</SpokenWords>
        </>
      ),
    },
    // 最後のページ：「終わる」で準備の画面へ戻る
    check: {
      id: 'check',
      section: 'たしかめ',
      title: 'ひとりで解いてみましょう',
      stage: (
        <Equation
          a={TOTAL + 1}
          b={eat}
          visible={revealed}
          onReveal={() => setRevealed(true)}
        />
      ),
      content: (
        <>
          <div className={flowStyles.answer} aria-live="polite">
            <TeachingPoints
              collapsible
              note={`親は手を出さず、**見守りましょう**。${eat}個を自分でよけて、残りだけを数えられていれば、解けています。`}
            />
            {revealed ? (
              <SpokenWords title={`「${TOTAL + 1 - eat}」と答えたら`}>
                {words.alone}
              </SpokenWords>
            ) : (
              <SpokenWords>{words.check(eat)}</SpokenWords>
            )}
          </div>
          {revealed && (
            <button
              className={flowStyles.finish}
              type="button"
              onClick={finish}
            >
              終わる
            </button>
          )}
        </>
      ),
    },
  }

  return (
    <LessonSlides
      label="見本の台本"
      slides={pages.map((page) => slides[page])}
      currentId={page}
      totalKnown
      canNext={canNext}
      onNext={() => go(pages[index + 1])}
      onBack={() => go(pages[index - 1])}
    />
  )
}

export default function Sample() {
  const [eat, setEat] = useState<number>(2)
  const location = useLocation()
  // 準備の画面の「数を変える」に出す欄
  const editor = (
    <fieldset className={choiceStyles.numberChoice}>
      <legend>食べる数</legend>
      <div>
        {EATS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={value === eat}
            onClick={() => setEat(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  )
  return (
    <TeachingScript
      flow={<SampleFlow eat={eat} />}
      flowStatus={() =>
        flowStatus(sessionStorage.getItem(storageKey(location.pathname)), eat)
      }
      editor={editor}
      // 準備の画面のステージに大きく出す図
      picture={<Candies total={TOTAL} />}
      prepare={{
        // この学習でやること・用意するもの・いちばん大事なこと・言わないようにしたいこと
        goal: `${TOTAL}このあめから${eat}こ食べた残りを、よけて数えます。`,
        materials: [`お菓子やおはじきを${TOTAL + 1}こ`],
        point:
          '食べた分を離れた場所によけると、残りだけを数えやすくなります。答えは先に言わず、お子さんが数えるのを待ちましょう。',
        avoid: [
          `先に「答えは${TOTAL - eat}こ」と言う`,
          '食べた分と残りを混ぜたまま数えさせる',
        ],
        // 使い方の3つ目と、詳しい教え方の1つ目。単元に合わせて書きたいときだけ書く
        together: '食べた分をよけてもらい、残りを一緒に確かめます。',
        approach: '身近なお菓子を、お子さんの手でよけて数える',
      }}
      // 「声かけを先に読んでおく」に出す。台本のページと同じ words を使う
      question={{ say: words.read(eat) }}
      turns={[
        { say: words.physical(eat) },
        { say: words.ask },
        { say: `（答えたら）${words.right(eat)}` },
        { say: `（たしかめ）${words.explain}` },
        { say: `（たしかめ）${words.check(eat)}` },
      ]}
    />
  )
}
