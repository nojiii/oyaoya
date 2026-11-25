// 台本とデザインの見本。新しい問題を作るときは、このフォルダを丸ごとコピーして書き換える。
// 一覧（curriculum.ts）には置かないので、/problems/sample を直接開いたときだけ見られる。
// 題材（あめのひき算）は書き方を見せるための例で、本番の単元の教え方ではない
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import {
  TeachingScript,
  type FlowStatus,
} from '../../components/TeachingScript'
import { LessonSlides, type LessonSlide } from '../../components/LessonSlides'
import { Oyajii } from '../../components/Oyajii'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { useScriptControls } from '../../components/scriptControls'
import { ContinueToCheck } from '../../components/ContinueToCheck'
import {
  CONTINUE_TO_CHECK_TITLE,
  CONTINUE_TO_CHECK_WORDS,
} from '../../components/continueToCheckWords'
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
  ask: '残っているあめを、1こずつ数えてみよう。残りは何こかな？',
  // 答えのページでは、お子さんの答えごとに言うセリフを分ける
  right: (eat: number) =>
    `そう！ ${TOTAL}こから${eat}こ食べると、残りは${TOTAL - eat}こだね！`,
  wrong: 'おしい！ 残っているあめを、1こずつ指でさして数えてみよう。',
  explain: 'どうやって答えを見つけたの？ おしえてくれる？',
  // たしかめに進むかを聞く。全問共通のセリフ（ContinueToCheck）
  more: CONTINUE_TO_CHECK_WORDS,
  check: (eat: number) =>
    `こんどは、あめが${TOTAL + 1}こ。${eat}こ食べると、残りは何こ？ ひとりでやってみよう。`,
  alone: (eat: number) =>
    `ひとりでできたね！ ${TOTAL + 1}こから${eat}こ食べると、残りは${TOTAL + 1 - eat}こだね。`,
  aloneWrong:
    'おしい！ さっきと同じように、食べた分をよけて、残りを数えてみよう。',
}

// 答えを聞くページ（count・check）の、教え方のポイントの最後に置く。
// 答えは「？」を押して出すのではなく、スワイプで次の答えのページへ進んで見る。
// 答えのページには初めから答えが出ているので、お子さんが答えるまで送らない
const BEFORE_ANSWER =
  '**お子さんが答えてから**、次のページへ進みます。次のページには、初めから答えが出ています。'

// 台本のページ。左へスワイプで次、右へで前。explain・check・checkAnswer が「たしかめ」。
// その前の more は、答えのあと、たしかめに進むか、ここで終わるかを決めるページ。
// 答えを聞くページ（count・check）と、答えを出すページ（answer・checkAnswer）は分ける
const pages = [
  'read',
  'choose',
  'take',
  'count',
  'answer',
  'more',
  'explain',
  'check',
  'checkAnswer',
] as const
type Page = (typeof pages)[number]
type Route = 'physical' | 'picture'

interface Progress {
  eat: number
  route: Route | null
  page: Page
}

// 進み具合は、同じタブの中で保存する（準備の画面へ戻ると、台本の部品は作り直されるため）。
// この見本は、選んだ方法（route）と食べる数も一緒に保存している
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
  return saved.page === 'checkAnswer' ? 'finished' : 'middle'
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

// ステージに置く式。答えを聞くページでは「？」を、答えのページでは答え（visible）を出す
function Equation({
  a,
  b,
  visible,
}: {
  a: number
  b: number
  visible: boolean
}) {
  return (
    <p className={flowStyles.equation}>
      {a} − {b} ＝ <em>{visible ? a - b : '？'}</em>
    </p>
  )
}

function SampleFlow({ eat }: { eat: number }) {
  // 最後のページの「終わる」で、準備の画面へ戻る。
  // 準備の画面から開いたときは、最初から（保存した続きは、台本を開いたまま読み直したときだけ使う）
  const { finish, startFrom } = useScriptControls()
  const key = storageKey(useLocation().pathname)
  const [progress, setProgress] = useState<Progress>(() => {
    if (startFrom !== 'saved') return { eat, route: null, page: 'read' }
    try {
      const saved = readProgress(sessionStorage.getItem(key), eat)
      // 最後のページまで終えたあとは、最初から
      if (saved && saved.page !== 'checkAnswer') return saved
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
  const { route, page } = progress
  const index = pages.indexOf(page)
  const go = (next: Page | undefined) => {
    if (next) setProgress({ ...progress, page: next })
  }
  // 選ぶまでは進めない。最後のページから先はない。それ以外のページは、いつでもスワイプで進む
  const canNext = page === 'choose' ? route !== null : page !== 'checkAnswer'

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
    // 答えを聞くページ：答えは先に言わず、お子さんに答えてもらう。
    // 教え方のポイントの最後に、答えてから次の答えのページへ進むことを書く（BEFORE_ANSWER）
    count: {
      id: 'count',
      title: '残りはいくつかな？',
      stage: <Candies total={TOTAL} eaten={eat} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={`よけたあめは数えずに、**残りだけを1個ずつ指さしながら**数えます。親が先に答えを言わず、お子さんが最後まで数えるのを待ちましょう。\n\n${BEFORE_ANSWER}`}
          />
          <SpokenWords>{words.ask}</SpokenWords>
        </>
      ),
    },
    // 答えのページ：前のページで答えてもらっているので、聞き直さず、初めから答えを出す（押して出さない）。
    // お子さんの答えごとのセリフを出す（主のセリフの代わりに言うものは minor で小さく）。
    // ステージのおやじいは、答えのページに来たときに喜ぶ（motion の correct）
    answer: {
      id: 'answer',
      title: '残りを確認しましょう！',
      stage: (
        <>
          <Oyajii
            className={flowStyles.answerMascot}
            motion={page === 'answer' ? 'correct' : null}
          />
          <Equation a={TOTAL} b={eat} visible />
        </>
      ),
      content: (
        <div className={flowStyles.answer}>
          <TeachingPoints
            collapsible
            note={
              'お子さんが前のページで答えた数に合わせて、声をかけましょう。\n\nちがう数を答えたときは、前のページに戻って数え直します。親は数えずに、**残りだけを数えているか**を見守りましょう。'
            }
          />
          <SpokenWords title={`「${TOTAL - eat}」と答えたら`}>
            {words.right(eat)}
          </SpokenWords>
          <SpokenWords title="ちがう数を答えたら" minor>
            {words.wrong}
          </SpokenWords>
        </div>
      ),
    },
    // 答えのあと、ほめてから、たしかめに進むかを決める（部品は ContinueToCheck。全問共通）。たしかめの前なので、札は付かない。
    // 進むときはスワイプで進み、やめるときは「ここで終わる」。保存した進み具合を消すので、次は最初のページから
    more: {
      id: 'more',
      title: CONTINUE_TO_CHECK_TITLE,
      content: <ContinueToCheck storageKey={key} />,
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
    // ちがう数の問題を、ひとりで解いてもらう（答えを聞くページ）。元の問題をまねるだけでは解けない数にする
    check: {
      id: 'check',
      section: 'たしかめ',
      title: 'ひとりで解いてみましょう',
      stage: <Equation a={TOTAL + 1} b={eat} visible={false} />,
      content: (
        <div className={flowStyles.answer}>
          <TeachingPoints
            collapsible
            note={`親は手を出さず、**見守りましょう**。${eat}個を自分でよけて、残りだけを数えられていれば、解けています。\n\n${BEFORE_ANSWER}`}
          />
          <SpokenWords>{words.check(eat)}</SpokenWords>
        </div>
      ),
    },
    // 最後のページ：本編の答えのページと同じく、初めから答えを出す。「終わる」で準備の画面へ戻る
    checkAnswer: {
      id: 'checkAnswer',
      section: 'たしかめ',
      title: '答えを確認しましょう！',
      stage: <Equation a={TOTAL + 1} b={eat} visible />,
      content: (
        <>
          <div className={flowStyles.answer}>
            <TeachingPoints
              collapsible
              note={
                'お子さんが前のページで答えた数に合わせて、声をかけましょう。\n\nちがう数を答えたときは、**どこでつまずいたか**を見ましょう。食べた分をよけずに数えていたら、よけるところから一緒にやり直します。\n\nひとりでできなくても大丈夫です。今日は**一緒にできたこと**をほめて終わりましょう。'
              }
            />
            <SpokenWords title={`「${TOTAL + 1 - eat}」と答えたら`}>
              {words.alone(eat)}
            </SpokenWords>
            <SpokenWords title="ちがう数を答えたら" minor>
              {words.aloneWrong}
            </SpokenWords>
          </div>
          <button
            className={flowStyles.finish}
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
  // 準備の画面で、図の下に出す数を変える欄
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
        // この学習でやること
        goal: `${TOTAL}このあめから${eat}こ食べた残りを、よけて数えます。`,
        // 用意するもの
        materials: [`お菓子やおはじきを${TOTAL + 1}こ`],
        // 教え方の流れ。台本の大まかな流れを、短い言葉で3〜6こに。台本のページと1対1にしなくてよい
        steps: [
          '問題を読む',
          '食べた分をよける',
          '残りを数えて確かめる',
          '考え方を話してもらう',
          'ひとりで解く',
        ],
        // いちばん大事なこと。台本の「困ったら」の「何を言えばいいか迷う」で出す
        point:
          '食べた分を離れた場所によけると、残りだけを数えやすくなります。答えは先に言わず、お子さんが数えるのを待ちましょう。',
      }}
      // 台本の右上の「困ったら」で出す答え。この問題に合わせたいものだけを書く（書かなければ全問共通の答え）。
      // 選べる困りごとは stuck（答えられない）・wrong（ちがう答え）・unsure（何を言えばいいか迷う）・tired（疲れた）
      help={{
        stuck: {
          say: '食べた分を、こっちによけてみようか',
          do: '食べた分をお子さんの手でよけてもらい、残りだけを指さして一緒に数えます。',
        },
      }}
      // 「声かけを先に読んでおく」に出す。台本のページと同じ words を使う
      question={{ say: words.read(eat) }}
      turns={[
        { say: words.physical(eat) },
        { say: words.ask },
        { say: `（答えたら）${words.right(eat)}` },
        { say: `（たしかめの前に）${words.more}` },
        { say: `（たしかめ）${words.explain}` },
        { say: `（たしかめ）${words.check(eat)}` },
      ]}
    />
  )
}
